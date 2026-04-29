"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import Card from "@/app/components/Card"; 
import Button from "@/app/components/Button";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  ShoppingBag, FileText, Wand2, Upload, User 
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
      alert("Upload failed: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from('branding').getPublicUrl(filePath);
      setBranding(prev => ({ ...prev, logo_url: data.publicUrl }));
    }
    setIsUploading(false);
  };

  const applyClarity = () => {
    if (!form.content || isEnhancing) return;
    setIsEnhancing(true);
    
    setTimeout(() => {
      const refined = form.content
        .replace(/\b(just|actually|really|maybe|basically)\b/gi, "")
        .replace(/\b(help)\b/gi, "facilitate")
        .replace(/\b(contact us)\b/gi, "initiate correspondence")
        .replace(/\s\s+/g, ' ');
      
      setForm(prev => ({ ...prev, content: refined.trim() }));
      setIsEnhancing(false);
    }, 800);
  };

  const handleSchedule = async () => {
    if (!teamId) return alert("Authentication error.");
    if (!form.title || !form.subject || !form.scheduled_for || !form.list_id) {
      return alert("Required fields: Title, Subject, Audience, and Schedule Date.");
    }

    setLoading(true);
    const finalContent = `${form.content}\n\n---\n${branding.company_name}\n${branding.contact_details}`;

    const { error } = await supabase.from("campaigns").insert([{ 
      ...form, 
      team_id: teamId, 
      status: 'scheduled',
      content: finalContent,
      meta_branding: branding
    }]);

    if (error) {
      alert("Transmission error: " + error.message);
    } else {
      setShowModal(false);
      loadData(teamId);
      setForm({ title: "", subject: "", list_id: "", template_id: "minimal", scheduled_for: "", content: "" });
    }
    setLoading(false);
  };

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto min-h-screen bg-[#faf9f6] text-stone-900">
      <header className="flex justify-between items-end border-b border-stone-200 pb-12">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Communications</p>
          <h1 className="text-5xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-stone-900 text-[#a9b897] flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-stone-800 transition-colors">
          <Plus size={16} /> New Dispatch
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section className="lg:col-span-8 space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Queue</h2>
          {campaigns.length === 0 ? (
            <div className="p-16 text-center bg-white border border-stone-100 rounded-[3rem] italic text-stone-300">Horizon Clear.</div>
          ) : (
            campaigns.map(c => (
              <Card key={c.id} className="bg-white p-8 rounded-[2.5rem] flex justify-between items-center group border-stone-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-50 rounded-2xl text-stone-200 group-hover:text-[#a9b897] transition-colors">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{c.title}</h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                      {new Date(c.scheduled_for).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-stone-50 rounded-full text-[#a9b897]">{c.status}</div>
              </Card>
            ))
          )}
        </section>

        <aside className="lg:col-span-4 bg-[#1c1c1c] rounded-[3rem] p-10 text-white h-fit shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Segments</h2>
          <div className="space-y-1">
            {lists.map(l => (
              <div key={l.id} className="flex justify-between items-center border-b border-stone-800 py-4 text-xs font-bold hover:text-[#a9b897] cursor-default transition-colors">
                {l.name} 
                <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897] shadow-[0_0_8px_#a9b897]" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0" onClick={() => !loading && setShowModal(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-2xl flex overflow-hidden border border-stone-200 relative z-10"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-stone-50 text-stone-400 z-20"><X size={24} /></button>

              <div className="w-80 bg-stone-50 border-r border-stone-100 flex flex-col p-10 overflow-y-auto shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8">Structure</p>
                <div className="space-y-2 mb-10">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${form.template_id === t.id ? 'bg-white border-stone-200 shadow-sm opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
                    >
                      <div className={form.template_id === t.id ? 'text-[#a9b897]' : 'text-stone-300'}>{t.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-6">Settings</p>
                <div className="space-y-6">
                  <input placeholder="Campaign Title" className="w-full bg-transparent border-b border-stone-200 py-2 text-[10px] font-black uppercase outline-none focus:border-stone-900 transition-colors" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  <select className="w-full bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer" value={form.list_id} onChange={e => setForm({...form, list_id: e.target.value})}>
                    <option value="">Select Audience</option>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-stone-400">Launch Date</label>
                    <input type="datetime-local" className="w-full bg-transparent text-[10px] font-black outline-none" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-[#fcfbf9] overflow-y-auto p-12 flex flex-col items-center">
                <div className="w-full max-w-2xl flex justify-end mb-6">
                  <button 
                    onClick={applyClarity}
                    disabled={isEnhancing || !form.content}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 ${isEnhancing ? 'text-[#a9b897]' : 'text-stone-400'}`}
                  >
                    <Wand2 size={14} className={isEnhancing ? "animate-spin" : ""} />
                    {isEnhancing ? "Refining Style..." : "Clarity Engine"}
                  </button>
                </div>

                <div className={`bg-white w-full max-w-2xl min-h-[800px] shadow-2xl rounded-[3.5rem] p-16 flex flex-col border border-stone-100 relative ${form.template_id === 'letter' ? 'text-center' : ''}`}>
                  <header className="mb-12 flex justify-center">
                    <label className="h-14 w-14 bg-stone-50 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden transition-all">
                      {branding.logo_url ? 
                        <img src={branding.logo_url} className="h-full w-full object-cover grayscale" alt="Logo" /> : 
                        <Upload size={16} className={`${isUploading ? 'animate-bounce' : ''} text-stone-300`} />
                      }
                      <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                    </label>
                  </header>

                  <div className="flex-1 space-y-8">
                    <input 
                      placeholder="Subject Line..."
                      className="w-full text-4xl font-serif italic tracking-tighter outline-none bg-transparent placeholder:text-stone-100 text-stone-900 border-none focus:ring-0"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                    />

                    {form.template_id === 'visual' && <div className="w-full h-64 bg-stone-50 rounded-[2.5rem] border border-stone-100 flex items-center justify-center text-stone-200 font-serif italic">Image Placeholder</div>}
                    
                    <textarea 
                      placeholder="Your story begins here..."
                      className="w-full flex-1 text-lg font-serif leading-relaxed text-stone-600 outline-none bg-transparent resize-none placeholder:text-stone-100 italic min-h-[300px]"
                      value={form.content}
                      onChange={e => setForm({...form, content: e.target.value})}
                    />
                  </div>

                  <footer className="mt-auto pt-10 border-t border-stone-50 space-y-4">
                    <input 
                      className="w-full text-center text-[10px] font-black uppercase tracking-[0.5em] outline-none bg-transparent text-stone-900"
                      value={branding.company_name}
                      onChange={e => setBranding({...branding, company_name: e.target.value})}
                      placeholder="Company Name"
                    />
                    <textarea 
                      className="w-full text-center text-[9px] text-stone-300 uppercase tracking-widest outline-none bg-transparent h-12 resize-none italic leading-relaxed"
                      value={branding.contact_details}
                      onChange={e => setBranding({...branding, contact_details: e.target.value})}
                      placeholder="Address / Contact"
                    />
                  </footer>
                </div>

                <div className="mt-12 flex items-center gap-10">
                   <button onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-colors">Discard</button>
                   <Button 
                    disabled={loading || isEnhancing}
                    onClick={handleSchedule} 
                    className="bg-stone-900 text-[#a9b897] px-20 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {loading ? "Processing..." : "Schedule Transmission"}
                   </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}