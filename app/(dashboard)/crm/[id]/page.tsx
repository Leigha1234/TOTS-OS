"use client";

import { use, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Building2, Mail, ArrowLeft, ShieldCheck, 
  Edit3, Trash2, X, Check, 
  ListTodo, Plus, Send, Upload, Loader2, Phone, MapPin, Zap, Calendar, Paperclip
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'email'>('info');
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);

  // Form States
  const [editForm, setEditForm] = useState({ 
    name: "", role: "", email: "", phone: "", address: "", company_name: "", company_details: "" 
  });
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    assigned_to: "",
    attachment: null as File | null
  });

  useEffect(() => {
    fetchProfile();
    fetchTeam();
    fetchTasks();
  }, [resolvedParams.id]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").eq("id", resolvedParams.id).single();
    if (!error) {
      setProfile(data);
      setEditForm({
        name: data.name || "",
        role: data.role || "user",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        company_name: data.company_name || "",
        company_details: data.company_details || ""
      });
    }
    setLoading(false);
  }

  async function fetchTeam() {
    const { data } = await supabase.from("profiles").select("id, name").eq("role", "admin");
    setTeamMembers(data || []);
  }

  async function fetchTasks() {
    const { data } = await supabase.from("tasks").select("*").eq("profile_id", resolvedParams.id).order("created_at", { ascending: false });
    setTasks(data || []);
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("profiles").update(editForm).eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    setTaskSaving(true);

    let attachmentUrl = "";

    // 1. Handle File Upload if exists
    if (newTask.attachment) {
      const file = newTask.attachment;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('task-attachments').upload(fileName, file);
      if (data) attachmentUrl = data.path;
    }

    // 2. Insert Task
    const { data, error } = await supabase.from("tasks").insert([{
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null,
      profile_id: profile.id,
      attachment_url: attachmentUrl,
      status: 'todo'
    }]).select().single();

    if (!error) {
      setTasks([data, ...tasks]);
      setNewTask({ title: "", description: "", due_date: "", assigned_to: "", attachment: null });
    }
    setTaskSaving(false);
  };

  if (loading) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Accessing Node...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-16 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Link href="/crm" className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] group">
            <ArrowLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Directory</span>
          </Link>
          <div className="flex gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                <Edit3 size={14} /> Edit Identity
              </button>
            ) : (
              <button onClick={handleUpdate} disabled={isSaving} className="px-8 py-3 bg-[#a9b897] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest">
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : "Commit Changes"}
              </button>
            )}
          </div>
        </div>

        {/* IDENTITY DISPLAY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-6xl font-serif italic tracking-tighter uppercase break-words">
              {isEditing ? (
                <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="bg-transparent border-b border-[#a9b897] outline-none w-full" />
              ) : profile.name}
            </h1>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white p-4 px-6 rounded-2xl border border-stone-100 flex items-center gap-3">
                <Mail size={16} className="text-[#a9b897]" />
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{profile.email}</span>
              </div>
              <div className="bg-white p-4 px-6 rounded-2xl border border-stone-100 flex items-center gap-3">
                <Building2 size={16} className="text-[#a9b897]" />
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{profile.company_name || "Individual"}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-stone-900 rounded-[3rem] p-8 text-white flex flex-col justify-center gap-4">
             <p className="text-[10px] font-black uppercase text-stone-500 tracking-[0.3em]">Operational Role</p>
             <p className="font-serif italic text-4xl text-[#a9b897] capitalize">{profile.role}</p>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 border-b border-stone-200 pb-4">
          {['info', 'tasks', 'email'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === t ? 'bg-[#a9b897] text-white shadow-lg' : 'bg-white text-stone-400'}`}>
              {t === 'info' ? 'Attributes' : t}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-stone-100 space-y-6">
                <div className="flex items-center gap-3 text-[#a9b897]"><Phone size={18}/><p className="text-xs font-bold uppercase tracking-widest">{profile.phone || "No direct link"}</p></div>
                <div className="flex items-center gap-3 text-[#a9b897]"><MapPin size={18}/><p className="text-xs font-bold uppercase tracking-widest">{profile.address || "Unlocalized"}</p></div>
                <div className="pt-6 border-t border-stone-50">
                  <p className="text-[10px] font-black uppercase text-stone-300 mb-2">Internal Notes</p>
                  <p className="font-serif italic text-stone-600">{profile.company_details || "No operational intelligence provided."}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-5 gap-12">
              {/* TASK CREATOR */}
              <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm h-fit">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8 flex items-center gap-2">
                  <Plus size={14} className="text-[#a9b897]"/> Assign Operation
                </h3>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <input required placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#a9b897]" />
                  <textarea placeholder="Operational Description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none h-24 resize-none" />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                      <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full bg-stone-50 p-4 pl-10 rounded-xl text-[10px] outline-none" />
                    </div>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                      <select value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} className="w-full bg-stone-50 p-4 pl-10 rounded-xl text-[10px] outline-none appearance-none">
                        <option value="">Assign To...</option>
                        {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] transition-all">
                      <Paperclip size={14}/>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{newTask.attachment ? newTask.attachment.name : "Attach Intelligence"}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setNewTask({...newTask, attachment: e.target.files?.[0] || null})} />
                  </div>

                  <button disabled={taskSaving} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all shadow-xl">
                    {taskSaving ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Instate Task"}
                  </button>
                </form>
              </div>

              {/* TASK LIST */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Queued Actions</h3>
                {tasks.length === 0 ? (
                  <div className="py-20 text-center opacity-30"><ListTodo className="mx-auto mb-4" size={32}/><p className="text-xs font-serif italic">No pending operations.</p></div>
                ) : (
                  tasks.map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase text-stone-800">{t.title}</p>
                        <div className="flex items-center gap-3">
                           {t.due_date && <span className="text-[8px] font-black uppercase text-[#a9b897] tracking-widest">Due: {format(new Date(t.due_date), "MMM d")}</span>}
                           {t.attachment_url && <Paperclip size={10} className="text-stone-300"/>}
                        </div>
                      </div>
                      <div className="bg-stone-50 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-stone-400">
                        {t.status}
                      </div>
                    </div>
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