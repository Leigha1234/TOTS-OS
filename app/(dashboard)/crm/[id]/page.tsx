"use client";

import { use, useEffect, useState, useRef } from "react";
import { getBrowserClient } from "@/lib/supabase";
const supabase = getBrowserClient();
import { 
  User, Building2, Mail, ArrowLeft,
  Edit3, Loader2, Phone, MapPin, Zap, Calendar, Paperclip, Radio, Database, ListPlus, Send, CheckCircle2, XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useSettings } from "@/app/context/SettingsContext";

export default function AccountProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailFileInputRef = useRef<HTMLInputElement>(null);
  const { organisationId } = useSettings();
  
  const [profile, setProfile] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'email'>('info');
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Form States
  const [editForm, setEditForm] = useState({ 
    name: "", 
    role: "", 
    email: "", 
    phone: "", 
    address: "", 
    company_name: "", 
    company_details: "",
    email_list: false 
  });
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    assigned_to: "",
    attachment: null as File | null
  });

  const [newEmail, setNewEmail] = useState({
    subject: "",
    body: "",
    attachment: null as File | null
  });

  useEffect(() => {
    if (resolvedParams.id && organisationId) {
      fetchProfile();
      fetchTeam();
      fetchTasks();
      fetchEmails();
    }
  }, [resolvedParams.id, organisationId]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", resolvedParams.id)
        .eq("organisation_id", organisationId) 
        .single();

    if (!error && data) {
      setProfile(data);
      setEditForm({
        name: data.name || "",
        role: data.role || "user",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        company_name: data.company_name || "",
        company_details: data.company_details || "",
        email_list: data.email_list || false
      });
    } else {
        router.push("/crm");
    }
    setLoading(false);
  }

  async function fetchTeam() {
    const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "admin")
        .eq("organisation_id", organisationId);
    setTeamMembers(data || []);
  }

  async function fetchTasks() {
    const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("profile_id", resolvedParams.id)
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: false });
    setTasks(data || []);
  }

  async function fetchEmails() {
    const { data } = await supabase
        .from("emails")
        .select("*")
        .eq("profile_id", resolvedParams.id)
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: false });
    setEmails(data || []);
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
        .from("profiles")
        .update(editForm)
        .eq("id", profile.id)
        .eq("organisation_id", organisationId);

    if (!error) {
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const toggleMailingListInline = async (newValue: boolean) => {
  if (!profile?.email) return;

  setStatusUpdating(true);

  // update profile toggle
  const { error } = await supabase
    .from("profiles")
    .update({ email_list: newValue })
    .eq("id", profile.id);

  if (!error) {
    // get first mailing list
    const { data: list } = await supabase
      .from("subscriber_lists")
      .select("id")
      .limit(1)
      .single();

    if (list?.id) {
      if (newValue) {
        // add subscriber
        await supabase
          .from("subscribers")
          .upsert({
            list_id: list.id,
            email: profile.email,
            first_name: profile.name || "",
            status: "subscribed"
          });
      } else {
        // remove subscriber
        await supabase
          .from("subscribers")
          .delete()
          .eq("email", profile.email);
      }
    }

    setProfile({
      ...profile,
      email_list: newValue
    });

    setEditForm({
      ...editForm,
      email_list: newValue
    });
  }

  setStatusUpdating(false);
};


  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    setTaskSaving(true);

    let attachmentUrl = "";

    if (newTask.attachment) {
      const file = newTask.attachment;
      const fileExt = file.name.split('.').pop();
      const fileName = `${organisationId}/${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('task-attachments').upload(fileName, file);
      if (data) attachmentUrl = data.path;
    }

    const { data, error } = await supabase.from("tasks").insert([{
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null,
      profile_id: profile.id,
      organisation_id: organisationId,
      attachment_url: attachmentUrl,
      status: 'todo'
    }]).select().single();

    if (!error) {
      setTasks([data, ...tasks]);
      setNewTask({ title: "", description: "", due_date: "", assigned_to: "", attachment: null });
    }
    setTaskSaving(false);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.subject || !newEmail.body) return;
    setEmailSaving(true);

    let attachmentUrl = "";

    if (newEmail.attachment) {
      const file = newEmail.attachment;
      const fileExt = file.name.split('.').pop();
      const fileName = `${organisationId}/${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('email-attachments').upload(fileName, file);
      if (data) attachmentUrl = data.path;
    }

    const { data, error } = await supabase.from("emails").insert([{
      subject: newEmail.subject,
      body: newEmail.body,
      profile_id: profile.id,
      organisation_id: organisationId,
      attachment_url: attachmentUrl,
      status: 'sent'
    }]).select().single();

    if (!error) {
      setEmails([data, ...emails]);
      setNewEmail({ subject: "", body: "", attachment: null });
    }
    setEmailSaving(false);
  };

  if (loading) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Loading Profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-16 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Link href="/crm" className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] group">
            <ArrowLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Client Profile</span>
          </Link>
          <div className="flex gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-stone-50">
                <Edit3 size={14} className="mr-2 inline" /> Edit Profile
              </button>
            ) : (
              <button onClick={handleUpdate} disabled={isSaving} className="px-8 py-3 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-colors">
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        {/* IDENTITY DISPLAY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter uppercase break-words leading-none">
              {isEditing ? (
                <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="bg-transparent border-b border-[#a9b897] outline-none w-full py-2" placeholder="Full Name" />
              ) : profile.name || "UNNAMED ACCOUNT"}
            </h1>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white p-4 px-6 rounded-2xl border border-stone-100 flex items-center gap-3 shadow-sm">
                <Mail size={16} className="text-[#a9b897]" />
                {isEditing ? (
                  <input value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="bg-transparent text-xs font-bold text-stone-700 outline-none uppercase tracking-widest border-b border-stone-200" placeholder="Email Address" />
                ) : (
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{profile.email || "No Email Provided"}</span>
                )}
              </div>
              
              <div className="bg-white p-4 px-6 rounded-2xl border border-stone-100 flex items-center gap-3 shadow-sm">
                <Building2 size={16} className="text-[#a9b897]" />
                {isEditing ? (
                  <input value={editForm.company_name} onChange={(e) => setEditForm({...editForm, company_name: e.target.value})} className="bg-transparent text-xs font-bold text-stone-700 outline-none uppercase tracking-widest border-b border-stone-200" placeholder="Company Name" />
                ) : (
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{profile.company_name || "No Company Provided"}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-stone-900 rounded-[3rem] p-10 text-white flex flex-col justify-center gap-4 shadow-2xl relative overflow-hidden">
             <Radio className="absolute -right-4 -top-4 w-32 h-32 opacity-10 text-[#a9b897]" />
             <p className="text-[10px] font-black uppercase text-stone-500 tracking-[0.3em] relative z-10">Account Access Level</p>
             {isEditing ? (
               <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="bg-stone-800 text-white p-3 rounded-xl font-serif italic text-2xl text-[#a9b897] capitalize relative z-10 outline-none border border-stone-700 appearance-none cursor-pointer">
                 <option value="client">Client</option>
                 <option value="lead">Lead</option>
                 <option value="admin">Administrator</option>
                 <option value="manager">Manager</option>
               </select>
             ) : (
               <p className="font-serif italic text-5xl text-[#a9b897] capitalize relative z-10">
                 {profile.role === 'user' ? 'Standard User' : profile.role}
               </p>
             )}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 border-b border-stone-200 pb-4">
          {[
            { id: 'info', label: 'Account Overview' },
            { id: 'tasks', label: 'Project Tasks' },
            { id: 'email', label: 'Communications' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab.id ? 'bg-[#a9b897] text-white shadow-xl translate-y-[-2px]' : 'bg-white text-stone-400 hover:text-stone-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
              <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 space-y-8 shadow-sm max-w-4xl">
                <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-[0.3em]">Contact Details</p>
                    
                    {/* Phone Field */}
                    <div className="flex items-center gap-4 text-stone-600">
                        <div className="p-3 bg-stone-50 rounded-xl"><Phone size={18} className="text-[#a9b897]"/></div>
                        {isEditing ? (
                          <div className="flex-1 space-y-1">
                            <label className="text-[7px] font-black uppercase text-stone-400">Phone Number</label>
                            <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-stone-50 p-2 text-xs font-bold uppercase tracking-widest text-stone-800 rounded-lg outline-none focus:ring-1 focus:ring-[#a9b897]" placeholder="Enter number..." />
                          </div>
                        ) : (
                          <p className="text-xs font-bold uppercase tracking-widest">{profile.phone || "No phone number recorded"}</p>
                        )}
                    </div>

                    {/* Location Address Field */}
                    <div className="flex items-center gap-4 text-stone-600">
                        <div className="p-3 bg-stone-50 rounded-xl"><MapPin size={18} className="text-[#a9b897]"/></div>
                        {isEditing ? (
                          <div className="flex-1 space-y-1">
                            <label className="text-[7px] font-black uppercase text-stone-400">Business Address</label>
                            <input value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full bg-stone-50 p-2 text-xs font-bold uppercase tracking-widest text-stone-800 rounded-lg outline-none focus:ring-1 focus:ring-[#a9b897]" placeholder="Enter corporate address..." />
                          </div>
                        ) : (
                          <p className="text-xs font-bold uppercase tracking-widest">{profile.address || "Address Location: Unassigned"}</p>
                        )}
                    </div>

                    {/* Email List Opt-In Field */}
                    <div className="flex items-center gap-4 text-stone-600 pt-2">
                        <div className="p-3 bg-stone-50 rounded-xl"><ListPlus size={18} className="text-[#a9b897]"/></div>
                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-stone-800">Mailing List</p>
                          </div>
                          {isEditing ? (
                            <input type="checkbox" checked={editForm.email_list} onChange={(e) => setEditForm({...editForm, email_list: e.target.checked})} className="w-5 h-5 rounded accent-[#a9b897] cursor-pointer" />
                          ) : (
                            <button 
                              onClick={() => toggleMailingListInline(!profile.email_list)} 
                              disabled={statusUpdating}
                              className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm transition-transform active:scale-95 ${profile.email_list ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'}`}
                            >
                              {statusUpdating ? "Updating..." : profile.email_list ? "Subscribed" : "Unsubscribed"}
                            </button>
                          )}
                        </div>
                    </div>
                </div>
                
                {/* Company Details / Corporate background notes */}
                <div className="pt-8 border-t border-stone-50 space-y-2">
                  <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Company Notes</p>
                  {isEditing ? (
                    <textarea value={editForm.company_details} onChange={(e) => setEditForm({...editForm, company_details: e.target.value})} className="w-full bg-stone-50 p-4 rounded-2xl text-xs font-serif italic text-stone-700 outline-none h-28 resize-none focus:ring-1 focus:ring-[#a9b897]" placeholder="Enter corporate background information..." />
                  ) : (
                    <p className="font-serif italic text-stone-600 leading-relaxed text-lg">
                      {profile.company_details || "No secondary profile overview details added to this account record."}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-5 gap-12">
              {/* TASK CREATOR */}
              <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-xl h-fit">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
                  <Zap size={14} className="text-[#a9b897]"/> Assign Project Task
                </h3>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Task Title</label>
                    <input required placeholder="Brief objective description..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#a9b897]" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Task Brief / Deliverables</label>
                    <textarea placeholder="Describe the strategic requirements..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none h-32 resize-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Due Date</label>
                        <div className="relative">
                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                        <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full bg-stone-50 p-4 pl-10 rounded-xl text-[10px] outline-none" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Assignee</label>
                        <div className="relative">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                        <select value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} className="w-full bg-stone-50 p-4 pl-10 rounded-xl text-[10px] outline-none appearance-none cursor-pointer">
                            <option value="">Select Resource...</option>
                            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] transition-all group">
                      <Paperclip size={14} className="group-hover:rotate-12 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{newTask.attachment ? newTask.attachment.name : "Attach Strategic Documentation"}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setNewTask({...newTask, attachment: e.target.files?.[0] || null})} />
                  </div>

                  <button disabled={taskSaving} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#a9b897] transition-all shadow-xl mt-4 active:scale-95">
                    {taskSaving ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Create Task"}
                  </button>
                </form>
              </div>

              {/* TASK LIST */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Pending Tasks</h3>
                    <div className="px-3 py-1 bg-stone-100 rounded-full text-[8px] font-black text-stone-400 uppercase tracking-widest">{tasks.length} Active</div>
                </div>

                {tasks.length === 0 ? (
                  <div className="py-32 text-center border-2 border-dashed border-stone-100 rounded-[3rem]">
                    <Database className="mx-auto mb-4 text-stone-100" size={48}/>
                    <p className="text-xs font-serif italic text-stone-300">No active tasks currently assigned to this account profile.</p>
                  </div>
                ) : (
                  tasks.map((t) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        key={t.id} 
                        className="bg-white p-8 rounded-[2.5rem] border border-stone-100 flex items-center justify-between group hover:border-[#a9b897] hover:shadow-2xl hover:shadow-[#a9b897]/5 transition-all duration-500"
                    >
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-stone-800 tracking-tight group-hover:text-[#a9b897] transition-colors">{t.title}</p>
                        <div className="flex items-center gap-4">
                           {t.due_date && (
                                <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1 rounded-full">
                                    <Calendar size={10} className="text-[#a9b897]" />
                                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">Target Date: {format(new Date(t.due_date), "MMM d, yyyy")}</span>
                                </div>
                            )}
                           {t.attachment_url && <Paperclip size={12} className="text-[#a9b897] animate-bounce"/>}
                        </div>
                      </div>
                      <div className="bg-stone-900 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#a9b897] shadow-lg">
                        {t.status === 'todo' ? 'Assigned' : t.status}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'email' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-5 gap-12">
              {/* EMAIL & MARKETING REGISTRY SIDE PANEL */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* INLINE MAILING LIST TOGGLE CARD */}
                <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ListPlus size={18} className="text-[#a9b897]" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-stone-800">Mailing List</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMailingListInline(!profile.email_list)}
                    disabled={statusUpdating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 ${
                      profile.email_list 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-stone-900 text-white hover:bg-[#a9b897]'
                    }`}
                  >
                    {statusUpdating ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : profile.email_list ? (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-600" /> Subscribed
                      </>
                    ) : (
                      <>
                        <XCircle size={12} className="text-stone-400" /> Add to List
                      </>
                    )}
                  </button>
                </div>

                {/* EMAIL CREATOR */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-xl h-fit">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
                    <Send size={14} className="text-[#a9b897]"/> Send New Email
                  </h3>
                  <form onSubmit={handleSendEmail} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Email Subject</label>
                      <input required placeholder="Brief communication objective..." value={newEmail.subject} onChange={e => setNewEmail({...newEmail, subject: e.target.value})} className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#a9b897]" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-stone-400 ml-1">Message Body</label>
                      <textarea required placeholder="Describe the core content or follow-up details..." value={newEmail.body} onChange={e => setNewEmail({...newEmail, body: e.target.value})} className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none h-32 resize-none focus:ring-1 focus:ring-[#a9b897]" />
                    </div>

                    <div className="pt-2">
                      <button type="button" onClick={() => emailFileInputRef.current?.click()} className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] transition-all group">
                        <Paperclip size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{newEmail.attachment ? newEmail.attachment.name : "Attach Documentation Files"}</span>
                      </button>
                      <input type="file" ref={emailFileInputRef} className="hidden" onChange={e => setNewEmail({...newEmail, attachment: e.target.files?.[0] || null})} />
                    </div>

                    <button disabled={emailSaving} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#a9b897] transition-all shadow-xl mt-4 active:scale-95">
                      {emailSaving ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Dispatch Email"}
                    </button>
                  </form>
                </div>
              </div>

              {/* EMAIL LOG HISTORY */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Communication History</h3>
                    <div className="px-3 py-1 bg-stone-100 rounded-full text-[8px] font-black text-stone-400 uppercase tracking-widest">{emails.length} Dispatched</div>
                </div>

                {emails.length === 0 ? (
                  <div className="py-32 text-center border-2 border-dashed border-stone-100 rounded-[3rem]">
                    <Mail className="mx-auto mb-4 text-stone-100" size={48}/>
                    <p className="text-xs font-serif italic text-stone-300">No written communication history recorded for this account profile.</p>
                  </div>
                ) : (
                  emails.map((m) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        key={m.id} 
                        className="bg-white p-8 rounded-[2.5rem] border border-stone-100 flex items-center justify-between group hover:border-[#a9b897] hover:shadow-2xl hover:shadow-[#a9b897]/5 transition-all duration-500"
                    >
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-stone-800 tracking-tight group-hover:text-[#a9b897] transition-colors">{m.subject}</p>
                        <p className="text-xs text-stone-400 line-clamp-1 max-w-md">{m.body}</p>
                        <div className="flex items-center gap-4">
                           {m.created_at && (
                                <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1 rounded-full">
                                    <Calendar size={10} className="text-[#a9b897]" />
                                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">Sent: {format(new Date(m.created_at), "MMM d, yyyy h:mm a")}</span>
                                </div>
                            )}
                           {m.attachment_url && <Paperclip size={12} className="text-[#a9b897] animate-bounce"/>}
                        </div>
                      </div>
                      <div className="bg-stone-100 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-stone-500">
                        {m.status}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}