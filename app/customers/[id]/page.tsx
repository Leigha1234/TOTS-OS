"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
// Updated imports to use the correct @ alias to prevent "Module not found"
import Card from "@/app/components/Card"; 
import Button from "@/app/components/Button";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  ShoppingBag, FileText, Wand2, Upload, User,
  Users, ChevronDown, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={16}/>, description: "Classic typewriter aesthetic." },
  { id: 'visual', name: 'Visual', icon: <ImageIcon size={16}/>, description: "Hero image focused design." },
  { id: 'letter', name: 'Founder', icon: <User size={16}/>, description: "Personalized letterhead style." },
  { id: 'report', name: 'Intel', icon: <FileText size={16}/>, description: "Structured data & insights." }
];

export default function CampaignsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audienceType, setAudienceType] = useState<'list' | 'individual'>('individual');
  
  const [branding, setBranding] = useState({
    logo_url: "",
    contact_details: "Studio 4, The Creative Quarter, London",
    company_name: "The Organised Types"
  });

  const [form, setForm] = useState({
    title: "",
    subject: "",
    list_id: "",
    customer_id: "",
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
    const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)").eq("team_id", tId).order("scheduled_for", { ascending: true });
    const { data: listRes } = await supabase.from("subscriber_lists").select("*").eq("team_id", tId);
    const { data: custRes } = await supabase.from("customers").select("*").eq("team_id", tId);
    
    setCampaigns(camps || []);
    setLists(listRes || []);
    setCustomers(custRes || []);
  }

  const handleSchedule = async () => {
    if (!teamId) return alert("Team ID missing.");
    
    // Logic check for audience selection
    const targetSet = audienceType === 'list' ? form.list_id : form.customer_id;
    if (!targetSet || !form.title || !form.subject) {
      return alert("Please ensure Title, Subject, and Audience are selected.");
    }

    setLoading(true);
    const payload = { 
      ...form, 
      team_id: teamId, 
      status: 'scheduled',
      // We merge the branding into the content or metadata for the delivery engine
      content: `${form.content}\n\n---\n${branding.company_name}\n${branding.contact_details}`
    };

    const { error } = await supabase.from("campaigns").insert([payload]);

    if (error) {
      alert("Scheduling failed: " + error.message);
    } else {
      setShowModal(false);
      loadData(teamId);
      // Reset local state
      setForm({ title: "", subject: "", list_id: "", customer_id: "", template_id: "minimal", scheduled_for: "", content: "" });
    }
    setLoading(false);
  };

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto min-h-screen bg-[#faf9f6] text-stone-900">
      
      {/* PAGE HEADER */}
      <div className="flex justify-between items-end border-b border-stone-200 pb-12">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Communications</p>
          <h1 className="text-5xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-stone-900 text-[#a9b897] flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
          <Plus size={16} /> New Dispatch
        </Button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Queue</h2>
          {campaigns.length === 0 ? (
            <div className="p-16 text-center bg-white border border-stone-100 rounded-[3rem] italic text-stone-300">No transmissions in queue.</div>
          ) : (
            campaigns.map(c => (
              <Card key={c.id} className="p-8 rounded-[2.5rem] flex justify-between items-center group">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-50 rounded-2xl text-[#a9b897]"><Clock size={20} /></div>
                  <div>
                    <h3 className="font-bold text-lg">{c.title}</h3>
                    <p className="text-[9px] uppercase tracking-widest text-stone-400">Scheduled: {new Date(c.scheduled_for).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-stone-100 rounded-full text-stone-500">{c.status}</div>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-4 bg-[#1c1c1c] rounded-[3rem] p-10 text-white h-fit shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-6">Audience Nodes</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase text-[#a9b897]">
              <span>Identified Customers</span>
              <span>{customers.length}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase text-stone-500 border-t border-stone-800 pt-4">
              <span>Mailing Lists</span>
              <span>{lists.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPOSER MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0" onClick={() => setShowModal(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-7xl h-[92vh] rounded-[4rem] shadow-3xl flex overflow-hidden border border-stone-200 relative z-10">
              
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-stone-50 text-stone-400 z-20"><X size={24} /></button>

              {/* SIDEBAR: SELECTION */}
              <div className="w-80 bg-stone-50 border-r border-stone-100 flex flex-col p-8 overflow-y-auto">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-6">1. Template</p>
                <div className="space-y-3 mb-10">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${form.template_id === t.id ? 'bg-white border-stone-200 shadow-md scale-[1.02]' : 'border-transparent opacity-50'}`}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <div className={form.template_id === t.id ? 'text-[#a9b897]' : 'text-stone-400'}>{t.icon}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-4">2. Audience</p>
                <div className="bg-stone-200/50 p-1 rounded-xl flex mb-6">
                  <button onClick={() => setAudienceType('individual')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${audienceType === 'individual' ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Individual</button>
                  <button onClick={() => setAudienceType('list')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${audienceType === 'list' ? 'bg-white shadow-sm' : 'text-stone-400'}`}>List</button>
                </div>

                <div className="space-y-6">
                  {audienceType === 'individual' ? (
                    <select className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[10px] font-bold uppercase outline-none" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[10px] font-bold uppercase outline-none" value={form.list_id} onChange={e => setForm({...form, list_id: e.target.value})}>
                      <option value="">Select List</option>
                      {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-stone-400">Reference Name</label>
                    <input className="w-full bg-transparent border-b border-stone-200 py-1 text-[10px] font-black uppercase outline-none" placeholder="e.g. April Newsletter" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-stone-400">Launch Time</label>
                    <input type="datetime-local" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[10px] font-bold outline-none" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* EDITOR CANVAS */}
              <div className="flex-1 bg-[#fcfbf9] overflow-y-auto p-12 flex flex-col items-center">
                
                <div className={`
                  w-full max-w-2xl min-h-[800px] shadow-3xl transition-all duration-500 rounded-[3.5rem] overflow-hidden flex flex-col border border-stone-100 bg-white
                  ${form.template_id === 'letter' ? 'p-20 text-center' : 'p-0'}
                  ${form.template_id === 'report' ? 'bg-[#faf9f6]' : ''}
                `}>
                  
                  {form.template_id === 'visual' && (
                    <div className="w-full h-64 bg-stone-100 flex items-center justify-center group cursor-pointer border-b border-stone-50">
                        <Upload size={24} className="text-stone-300" />
                    </div>
                  )}

                  <div className={`flex-1 flex flex-col ${form.template_id !== 'letter' ? 'p-16' : ''}`}>
                    <header className={`mb-12 flex ${form.template_id === 'letter' ? 'justify-center' : 'justify-start'}`}>
                       <div className="h-10 w-10 bg-stone-900 rounded-full" /> 
                    </header>

                    <input 
                      placeholder="Email Subject Line..."
                      className={`w-full outline-none bg-transparent placeholder:text-stone-100 text-stone-900 border-none focus:ring-0 mb-8 
                        ${form.template_id === 'minimal' || form.template_id === 'letter' ? 'text-4xl font-serif italic' : 'text-2xl font-black uppercase tracking-tight'}`}
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                    />

                    <textarea 
                      placeholder="Write your transmission..."
                      className={`w-full flex-1 outline-none bg-transparent resize-none placeholder:text-stone-100 leading-relaxed
                        ${form.template_id === 'letter' ? 'text-xl font-serif italic text-stone-600' : 'text-lg text-stone-700'}`}
                      value={form.content}
                      onChange={e => setForm({...form, content: e.target.value})}
                    />

                    {/* DOCK FOOTER INSIDE CARD */}
                    <footer className="mt-16 pt-10 border-t border-stone-50 text-center space-y-2">
                      <input 
                        className="w-full text-center text-[10px] font-black uppercase tracking-[0.4em] outline-none bg-transparent text-stone-900 placeholder:text-stone-200"
                        value={branding.company_name}
                        onChange={e => setBranding({...branding, company_name: e.target.value})}
                        placeholder="Company Name"
                      />
                      <input 
                        className="w-full text-center text-[9px] text-stone-300 uppercase tracking-[0.2em] outline-none bg-transparent italic placeholder:text-stone-100"
                        value={branding.contact_details}
                        onChange={e => setBranding({...branding, contact_details: e.target.value})}
                        placeholder="Contact or Address Details"
                      />
                    </footer>
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-10">
                   <button onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-colors">Discard</button>
                   <Button 
                    disabled={loading}
                    onClick={handleSchedule} 
                    className="bg-stone-900 text-[#a9b897] px-20 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
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