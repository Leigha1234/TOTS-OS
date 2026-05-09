"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Building2, Mail, ArrowLeft, ShieldCheck, 
  Edit3, Trash2, X, Check, 
  ListTodo, Plus, Send, Upload, Loader2, Phone, MapPin, Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'email'>('info');
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", role: "", avatar_url: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  const [taskTitle, setTaskTitle] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [resolvedParams.id]);

  async function fetchProfile() {
    setLoading(true);
    try {
      // FIXED: Pointing to 'profiles' instead of 'customers'
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        setDebugError(error.message);
      } else {
        setProfile(data);
        setEditForm({
          name: data.name || "",
          role: data.role || "user",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (err: any) { 
      setDebugError(err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(editForm)
      .eq("id", profile.id);
      
    if (!error) {
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    } else {
      alert(error.message);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (confirm("Decommission this node permanently from the directory?")) {
      const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
      if (!error) router.push("/crm");
    }
  };

  const handleAddTask = () => {
    if (!taskTitle) return;
    setTasks(prev => [{ id: Date.now(), title: taskTitle, status: 'todo' }, ...prev]);
    setTaskTitle("");
  };

  if (loading) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Accessing Node...</p>
    </div>
  );

  if (debugError || !profile) return (
    <div className="h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-serif italic mb-4">Deviation Detected</h1>
      <p className="text-xs text-red-500 font-mono mb-8">{debugError || "Profile not found"}</p>
      <Link href="/crm" className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
        Return to Directory
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-16 pb-32">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Link href="/crm" className="flex items-center gap-2 text-stone-400 hover:text-[#a9b897] group transition-colors">
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
                <button onClick={handleUpdate} disabled={isSaving} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-3 bg-[#a9b897] text-white rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-95">
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* PROFILE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 border-b border-stone-200 pb-8 md:pb-12">
          <div className="space-y-6 flex-1">
            <div className="p-4 bg-white w-fit rounded-2xl md:rounded-3xl text-[#a9b897] shadow-sm border border-stone-100">
              <User size={32} />
            </div>
            
            <div className="space-y-2">
              {isEditing ? (
                <input 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="text-4xl md:text-6xl font-serif italic tracking-tighter bg-transparent border-b border-[#a9b897] outline-none w-full"
                />
              ) : (
                <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter uppercase break-words">{profile.name}</h1>
              )}
            </div>

            <div className="flex items-center gap-4 text-stone-500 italic font-serif text-lg md:text-xl">
                <div className="flex items-center gap-3 bg-white/50 p-2 px-4 rounded-lg border border-stone-100">
                  <Zap size={18} className="text-[#a9b897] shrink-0" />
                  <span className="truncate">{profile.role || "Standard User"}</span>
                </div>
            </div>
          </div>

          {/* STATUS BOX */}
          <div className="p-6 md:p-8 px-10 flex flex-col justify-center gap-2 shadow-sm border-l-4 border-l-[#a9b897] bg-white rounded-r-2xl lg:min-w-[240px]">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">System Level</p>
              {isEditing ? (
                <select 
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="bg-transparent font-serif italic text-2xl text-[#a9b897] outline-none cursor-pointer w-full"
                >
                  <option value="user">User</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <p className="font-serif italic text-3xl text-[#a9b897] capitalize">{profile.role || "User"}</p>
              )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth">
          {[
            { id: 'info', label: 'Identity' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'email', label: 'Communications' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-[#a9b897] text-white' : 'bg-white border text-stone-400 hover:bg-stone-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 md:p-10 space-y-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm lg:col-span-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 border-b border-stone-100 pb-4">Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-black">UUID</label>
                    <p className="font-mono text-[10px] break-all opacity-40">{profile.id}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-stone-400 uppercase tracking-widest font-black">Metadata</label>
                    <p className="font-serif italic text-2xl">Verified Node</p>
                  </div>
                </div>
              </div>

              <div className="bg-stone-900 rounded-[2rem] md:rounded-[3rem] p-8 text-white flex flex-col justify-between">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 border-b border-stone-800 pb-4 mb-6">Vault</h3>
                   <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-700 rounded-2xl p-8 hover:border-[#a9b897] cursor-pointer transition-all bg-stone-800/30">
                      <Upload size={20} className="text-[#a9b897] mb-2"/>
                      <span className="text-[10px] font-black uppercase text-stone-400">Secure Upload</span>
                      <input type="file" className="hidden" />
                   </label>
                </div>
                <div className="mt-8 flex items-center gap-4 text-[#a9b897] opacity-60">
                   <ShieldCheck size={20}/>
                   <p className="text-[9px] font-black uppercase tracking-widest">Encrypted Storage</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Operational Tasks</h3>
                 <ListTodo size={14} className="text-[#a9b897]"/>
              </div>
              <div className="flex gap-2 mb-6">
                <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Assign action..." className="flex-1 text-xs p-3 border rounded-xl bg-stone-50 outline-none focus:ring-1 focus:ring-[#a9b897]" />
                <button onClick={handleAddTask} className="bg-[#a9b897] text-white p-3 rounded-xl active:scale-90 transition-all hover:brightness-95"><Plus size={16}/></button>
              </div>
              <div className="space-y-2">
                {tasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs">
                    <span className="font-serif italic">{t.title}</span>
                    <span className="text-[8px] bg-white px-2 py-1 rounded border uppercase">Queued</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'email' && (
             <div className="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm max-w-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-6">Dispatch Correspondence</h3>
                <div className="space-y-4">
                  <input placeholder="Subject" className="w-full text-xs p-4 border border-stone-100 rounded-xl bg-stone-50 outline-none focus:border-[#a9b897]" />
                  <textarea rows={5} placeholder="Message body..." className="w-full text-xs p-4 border border-stone-100 rounded-xl bg-stone-50 outline-none resize-none focus:border-[#a9b897]" />
                  <button className="w-full bg-[#a9b897] text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex justify-center items-center gap-2 hover:brightness-95">
                    <Send size={14}/> Transmit
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}