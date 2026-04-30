"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import Card from "@/app/components/Card"; 
import Button from "@/app/components/Button";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  ShoppingBag, FileText, Wand2, Upload, User, Loader2, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={16}/> },
  { id: 'visual', name: 'Visual', icon: <ImageIcon size={16}/> },
  { id: 'letter', name: 'Founder', icon: <User size={16}/> },
  { id: 'product', name: 'Product', icon: <ShoppingBag size={16}/> },
  { id: 'report', name: 'Intel', icon: <FileText size={16}/> }
];

export default function CampaignsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [branding, setBranding] = useState({
    logo_url: "",
    contact_details: "Studio 4, The Creative Quarter, London",
    company_name: "The Organised Types"
  });

  const [form, setForm] = useState({
    title: "",
    subject: "",
    list_id: "",
    template_id: "minimal",
    scheduled_for: "",
    content: ""
  });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      loadData(mem.team_id);
    }
  }

  async function loadData(tId: string) {
    const { data: camps } = await supabase.from("campaigns")
      .select("*, subscriber_lists(name)")
      .eq("team_id", tId)
      .order("scheduled_for", { ascending: true });
    
    const { data: listRes } = await supabase.from("subscriber_lists")
      .select("*")
      .eq("team_id", tId);
      
    setCampaigns(camps || []);
    setLists(listRes || []);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${teamId}/logo-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('branding')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload failed: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from('branding').getPublicUrl(filePath);
      setBranding(prev => ({ ...prev, logo_url: data.publicUrl }));
    }
    setIsUploading(false);
  };

  // --- REPAIRED CLARITY ENGINE ---
  const applyClarity = () => {
    if (!form.content || isEnhancing) return;
    setIsEnhancing(true);
    
    setTimeout(() => {
      const refined = form.content
        .replace(/\b(just|actually|really|maybe|basically|very|simply)\b/gi, "")
        .replace(/\b(help)\b/gi, "facilitate")
        .replace(/\b(contact us|email us)\b/gi, "initiate correspondence")
        .replace(/\b(get started)\b/gi, "commence protocol")
        .replace(/\b(fast|quick)\b/gi, "expeditious")
        .replace(/\s\s+/g, ' ')
        .trim();
      
      setForm(prev => ({ ...prev, content: refined }));
      setIsEnhancing(false);
    }, 1200); // Added slight delay for "feeling" the processing
  };

  const handleSchedule = async () => {
    if (!teamId) return;
    if (!form.title || !form.subject || !form.scheduled_for || !form.list_id) return;

    setLoading(true);
    const finalContent = `${form.content}\n\n---\n${branding.company_name}\n${branding.contact_details}`;

    const { error } = await supabase.from("campaigns").insert([{ 
      ...form, 
      team_id: teamId, 
      status: 'scheduled',
      content: finalContent,
      meta_branding: branding
    }]);

    if (!error) {
      setShowModal(false);
      loadData(teamId);
      setForm({ title: "", subject: "", list_id: "", template_id: "minimal", scheduled_for: "", content: "" });
    }
    setLoading(false);
  };

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto min-h-screen bg-[#faf9f6] text-stone-900 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-end border-b border-stone-200 pb-16 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Communications Hub</p>
          <h1 className="text-8xl font-serif italic text-stone-800 tracking-tighter leading-none">Campaigns</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-stone-900 text-[#a9b897] flex items-center gap-4 px-10 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={18} /> New Dispatch
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <section className="lg:col-span-8 space-y-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 ml-4">Scheduled Queue</h2>
          {campaigns.length === 0 ? (
            <div className="p-24 text-center bg-white border border-stone-100 rounded-[4rem] italic font-serif text-stone-300 text-xl shadow-sm">
              Horizon is currently clear.
            </div>
          ) : (
            campaigns.map(c => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={c.id} 
                className="bg-white p-10 rounded-[3.5rem] border border-stone-100 flex justify-between items-center group hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-stone-50 rounded-3xl text-stone-200 group-hover:text-[#a9b897] transition-colors group-hover:bg-stone-900">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif italic text-3xl text-stone-800">{c.title}</h3>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em] mt-2">
                      {new Date(c.scheduled_for).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="text-[9px] font-black uppercase tracking-[0.3em] px-5 py-2 bg-[#a9b897] rounded-full text-white shadow-lg shadow-[#a9b897]/20">{c.status}</div>
                   <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">{c.subscriber_lists?.name}</p>
                </div>
              </motion.div>
            ))
          )}
        </section>

        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-[#1c1c1c] rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mb-10">Active Segments</h2>
              <div className="space-y-2">
                {lists.map(l => (
                  <div key={l.id} className="flex justify-between items-center border-b border-stone-800 py-6 text-xs font-black uppercase tracking-widest hover:text-[#a9b897] cursor-pointer transition-colors group">
                    {l.name} 
                    <div className="h-2 w-2 rounded-full bg-stone-700 group-hover:bg-[#a9b897] transition-all" />
                  </div>
                ))}
              </div>
             </div>
             <Sparkles size={120} className="absolute -right-10 -bottom-10 text-stone-800/50" />
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-[1500px] h-full rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] flex flex-col md:flex-row overflow-hidden border border-stone-200 relative"
            >
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-10 right-10 p-4 rounded-full hover:bg-stone-50 text-stone-400 z-[110] transition-colors"
              >
                <X size={28} />
              </button>

              {/* SIDEBAR NAVIGATION */}
              <div className="w-full md:w-96 bg-stone-50 border-r border-stone-100 flex flex-col p-12 overflow-y-auto shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-12">Transmission Structure</p>
                <div className="space-y-3 mb-16">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full flex items-center gap-5 p-5 rounded-3xl border-2 transition-all ${form.template_id === t.id ? 'bg-white border-stone-900 shadow-sm' : 'border-transparent opacity-40 hover:opacity-100 hover:bg-stone-100/50'}`}
                    >
                      <div className={form.template_id === t.id ? 'text-[#a9b897]' : 'text-stone-300'}>{t.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.name}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-400 mb-8">Metadata Settings</p>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-stone-400 ml-4">Internal Title</label>
                    <input placeholder="CAMPAIGN_REF_01" className="w-full bg-white border border-stone-100 rounded-2xl px-5 py-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 ring-[#a9b897]/20" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-stone-400 ml-4">Target Segment</label>
                    <select className="w-full bg-white border border-stone-100 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer" value={form.list_id} onChange={e => setForm({...form, list_id: e.target.value})}>
                      <option value="">Select Audience</option>
                      {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-stone-400 ml-4">Launch Date</label>
                    <input type="datetime-local" className="w-full bg-white border border-stone-100 rounded-2xl px-5 py-4 text-[10px] font-black uppercase outline-none" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* EDITOR AREA */}
              <div className="flex-1 bg-[#fcfbf9] overflow-y-auto p-8 md:p-16 flex flex-col items-center">
                <div className="w-full max-w-3xl flex justify-between items-center mb-10">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#a9b897] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Live Preview Engine</span>
                  </div>
                  <button 
                    onClick={applyClarity}
                    disabled={isEnhancing || !form.content}
                    className={`flex items-center gap-4 px-8 py-4 rounded-full bg-white shadow-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 border border-stone-100 ${isEnhancing ? 'text-[#a9b897]' : 'text-stone-900'}`}
                  >
                    {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {isEnhancing ? "Refining Clarity..." : "Clarity Engine"}
                  </button>
                </div>

                {/* EMAIL CANVAS */}
                <div className={`bg-white w-full max-w-3xl min-h-[900px] shadow-[0_30px_80px_rgba(0,0,0,0.05)] rounded-[4rem] p-20 flex flex-col border border-stone-100 relative ${form.template_id === 'letter' ? 'text-center' : ''}`}>
                  <header className="mb-16 flex justify-center">
                    <label className="h-20 w-20 bg-stone-50 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden transition-all group">
                      {branding.logo_url ? 
                        <img src={branding.logo_url} className="h-full w-full object-cover" alt="Logo" /> : 
                        <Upload size={20} className={`${isUploading ? 'animate-bounce' : ''} text-stone-300 group-hover:text-[#a9b897]`} />
                      }
                      <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                    </label>
                  </header>

                  <div className="flex-1 space-y-12">
                    <input 
                      placeholder="Transmission Subject..."
                      className="w-full text-5xl font-serif italic tracking-tighter outline-none bg-transparent placeholder:text-stone-200 text-stone-800 border-none focus:ring-0"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                    />

                    {form.template_id === 'visual' && (
                      <div className="w-full h-80 bg-stone-50 rounded-[3rem] border border-stone-100 flex flex-col items-center justify-center text-stone-300 group cursor-pointer hover:bg-stone-100 transition-colors">
                        <ImageIcon size={40} className="mb-4 opacity-20" />
                        <span className="font-serif italic text-lg opacity-40">Visual Asset Required</span>
                      </div>
                    )}
                    
                    <textarea 
                      placeholder="Draft your correspondence here..."
                      className="w-full flex-1 text-2xl font-serif leading-relaxed text-stone-600 outline-none bg-transparent resize-none placeholder:text-stone-200 italic min-h-[400px]"
                      value={form.content}
                      onChange={e => setForm({...form, content: e.target.value})}
                    />
                  </div>

                  <footer className="mt-20 pt-12 border-t border-stone-50 space-y-6">
                    <input 
                      className="w-full text-center text-[11px] font-black uppercase tracking-[0.6em] outline-none bg-transparent text-stone-900 placeholder:text-stone-200"
                      value={branding.company_name}
                      onChange={e => setBranding({...branding, company_name: e.target.value})}
                      placeholder="Company Identifier"
                    />
                    <textarea 
                      className="w-full text-center text-[10px] text-stone-400 uppercase tracking-[0.3em] outline-none bg-transparent h-16 resize-none italic leading-relaxed"
                      value={branding.contact_details}
                      onChange={e => setBranding({...branding, contact_details: e.target.value})}
                      placeholder="Legal Footprint / Contact Details"
                    />
                  </footer>
                </div>

                <div className="mt-16 flex items-center gap-12 pb-12">
                   <button onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 hover:text-red-400 transition-colors">Abort Dispatch</button>
                   <button 
                    disabled={loading || isEnhancing || !form.subject || !form.list_id}
                    onClick={handleSchedule} 
                    className="bg-stone-900 text-[#a9b897] px-24 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                   >
                     {loading ? "Transmitting..." : "Schedule Dispatch"}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}