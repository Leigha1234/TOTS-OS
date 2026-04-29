"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase-client"; // Use your sync client
import { 
  User, Building2, Mail, ArrowLeft, ShieldCheck, 
  AlertCircle, Edit3, Trash2, X, Check 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", company: "", stage: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
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
          name: data.name,
          email: data.email,
          company: data.company,
          stage: data.stage || "Lead"
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
      <div className="max-w-5xl mx-auto space-y-12">
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
            </div>
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

        <div className="grid md:grid-cols-2 gap-10">
            <div className="p-10 space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
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
                </div>
            </div>

            <div className="p-10 rounded-[3rem] border border-dashed border-stone-200 flex flex-col justify-center items-center text-center space-y-4 opacity-60">
               <ShieldCheck size={32} className="text-[#a9b897]" />
               <p className="font-serif italic text-stone-500 leading-relaxed text-sm">
                 Encrypted record. Changes to this node are logged in the system activity audit trail.
               </p>
            </div>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return <div className={`border-2 border-stone-900 border-t-transparent rounded-full animate-spin ${className}`} style={{ width: size, height: size }} />
}