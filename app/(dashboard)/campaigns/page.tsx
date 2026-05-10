"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, Check, Sparkles, Calendar as CalendarIcon, 
  AlignLeft, Bold, Eye, Palette, Menu, Users, Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={14}/> },
  { id: 'creative', name: 'Creative', icon: <Sparkles size={14}/> },
  { id: 'bold', name: 'Bold', icon: <Bold size={14}/> },
  { id: 'colorful', name: 'Colourful', icon: <Palette size={14}/> },
  { id: 'elegant', name: 'Elegant', icon: <AlignLeft size={14}/> },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("Your Company");
  const [showModal, setShowModal] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  
  const [step, setStep] = useState<'editor' | 'schedule'>('editor');
  const [showClarityPrompt, setShowClarityPrompt] = useState(false);
  const [clarityTopic, setClarityTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    subject: "",
    list_id: "",
    template_id: "minimal",
    scheduled_for: "",
    content: ""
  });

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    loadData();
    fetchTeamInfo();
  }, [supabase]);

  async function loadData() {
    const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)");
    const { data: listRes } = await supabase.from("subscriber_lists").select("*");
    setCampaigns(camps || []);
    setLists(listRes || []);
  }

  async function fetchTeamInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: team } = await supabase.from("teams").select("company_name, name").single();
    if (team) setCompanyName(team.company_name || team.name || "Your Company");
  }

  const handleCreateList = async () => {
    if (!newListName) return;
    const { error } = await supabase.from("subscriber_lists").insert([{ name: newListName }]);
    if (!error) {
      setNewListName("");
      setShowListModal(false);
      loadData();
    }
  };

  const executeGeneration = () => {
    if (!clarityTopic) return;
    setIsGenerating(true);
    setTimeout(() => {
      const selectedStyle = TEMPLATES.find(t => t.id === form.template_id)?.name || "Minimalist";
      setForm(prev => ({ 
        ...prev, 
        subject: `News: ${clarityTopic.split(' ').slice(0, 3).join(' ')}`,
        content: `Dear Reader,\n\nHere is our summary covering the latest on ${clarityTopic} using the ${selectedStyle} style type.`
      }));
      setIsGenerating(false);
      setShowClarityPrompt(false);
    }, 1500);
  };

  const handleSchedule = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("campaigns").insert([{
      ...form,
      user_id: user?.id
    }]);
    if (!error) {
      setShowModal(false);
      loadData();
    }
  };

  const getTemplateStyleClasses = () => {
    switch (form.template_id) {
      case "creative": return "border-2 border-amber-300 bg-amber-50/10 text-amber-900";
      case "bold": return "border-2 border-stone-900 bg-stone-900/5 text-stone-900 font-black tracking-wide";
      case "colorful": return "border-2 border-teal-500 bg-teal-50/20 text-teal-900";
      case "elegant": return "border border-stone-300 font-serif bg-stone-50/5 text-stone-700";
      default: return "border border-stone-200 bg-white text-stone-600";
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-12 text-stone-900 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-16 border-b border-stone-200 pb-10 gap-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)] mb-3 opacity-80">Dispatch Center</p>
          <h1 className="text-5xl md:text-7xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <button 
          onClick={() => { setStep('editor'); setShowModal(true); }}
          className="bg-stone-900 text-[var(--brand-primary)] w-full md:w-auto px-8 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:brightness-110 transition-all"
        >
          <Plus size={18} /> New Campaign
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* FEED */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Scheduled Transmission</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[3.5rem] p-24 text-center shadow-sm">
              <p className="font-serif italic text-stone-200 text-2xl">Horizon Clear.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-stone-100 flex justify-between items-center group shadow-sm">
                <div className="flex items-center gap-8">
                  <div className="p-5 bg-stone-50 rounded-2xl text-[var(--brand-primary)]"><Clock size={20} /></div>
                  <div>
                    <h3 className="font-bold text-xl text-stone-800 uppercase tracking-tight">{c.title}</h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{c.subscriber_lists?.name || 'Manual Segment'}</p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-6 py-2 bg-stone-50 rounded-full text-stone-400 border border-stone-100">Scheduled</div>
              </div>
            ))
          )}
        </div>

        {/* SEGMENTS ASIDE */}
        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="bg-stone-50 border border-stone-200 rounded-[3.5rem] p-12 shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)]">Segments</p>
                <button onClick={() => setShowListModal(true)} className="p-2 bg-white rounded-full border border-stone-200 hover:bg-stone-100 transition-colors"><Plus size={14}/></button>
            </div>
            <div className="space-y-6">
              {lists.map(l => (
                <div key={l.id} className="flex justify-between items-center border-b border-stone-200 pb-4 text-[10px] font-black tracking-widest uppercase text-stone-600">
                  {l.name}
                  <Hash size={10} className="text-stone-300" />
                </div>
              ))}
              {lists.length === 0 && <p className="text-[10px] font-serif italic text-stone-400">No lists created.</p>}
            </div>
          </div>
        </aside>
      </div>

      {/* CREATE LIST MODAL */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
                <h3 className="text-2xl font-serif italic mb-6">New Segment</h3>
                <input 
                    value={newListName} onChange={e => setNewListName(e.target.value)}
                    placeholder="List name (e.g. Investors)" 
                    className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-6 outline-none focus:border-stone-900"
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowListModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Cancel</button>
                    <button onClick={handleCreateList} className="flex-1 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Create</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN EDITOR */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-10 bg-stone-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#faf9f6] w-full md:max-w-[1400px] h-full md:h-[85vh] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-stone-200"
            >
              {/* SIDEBAR */}
              <div className="w-full md:w-80 bg-stone-50 border-r border-stone-200 p-12 flex flex-col shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8">Visual Protocol</p>
                <div className="space-y-3">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${form.template_id === t.id ? 'bg-stone-900 text-[var(--brand-primary)] shadow-lg scale-105' : 'bg-white border border-stone-100 text-stone-600'}`}
                    >
                      {t.icon} <span>{t.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowModal(false)} className="mt-auto w-full bg-stone-200/50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-colors">Discard</button>
              </div>

              {/* EDITOR */}
              <div className="flex-1 bg-stone-100/30 p-8 md:p-16 overflow-y-auto no-scrollbar">
                {step === 'editor' && (
                  <div className="w-full max-w-3xl mx-auto pb-20">
                    <div className="flex justify-between items-center mb-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Transmission Draft</span>
                      <button onClick={() => setShowClarityPrompt(true)} className="px-6 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-stone-900 text-[var(--brand-primary)]">
                        <Wand2 size={14} /> Clarity AI
                      </button>
                    </div>

                    <AnimatePresence>
                      {showClarityPrompt && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="w-full bg-white p-8 mb-10 rounded-[3rem] border border-stone-200 shadow-sm overflow-hidden">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-600 mb-4">Core Objectives</h4>
                          <input 
                            value={clarityTopic} onChange={e => setClarityTopic(e.target.value)}
                            className="w-full p-5 text-sm font-serif italic bg-stone-50 rounded-2xl border border-stone-100 mb-4 outline-none"
                            placeholder="Describe the campaign intent..."
                          />
                          <div className="flex gap-2">
                            <button onClick={executeGeneration} className="bg-stone-900 text-[var(--brand-primary)] px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                              {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Generate
                            </button>
                            <button onClick={() => setShowClarityPrompt(false)} className="px-6 py-3 text-[9px] font-black uppercase text-stone-400">Cancel</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className={`w-full min-h-[800px] rounded-[4rem] p-12 md:p-24 flex flex-col shadow-2xl transition-all duration-500 ${getTemplateStyleClasses()}`}>
                      <input 
                        placeholder="Internal Campaign Name..." 
                        className="text-xl font-bold outline-none mb-8 bg-transparent border-b border-stone-900/10 pb-4 placeholder:opacity-30"
                        value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="Subject Line..." 
                        className="text-3xl md:text-5xl font-serif italic outline-none mb-12 bg-transparent placeholder:opacity-20 border-b border-stone-900/10 pb-8 resize-none h-32 leading-tight"
                        value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      />
                      <textarea 
                        placeholder="Commence transmission body..."
                        className="flex-1 text-xl font-serif italic leading-relaxed outline-none resize-none bg-transparent placeholder:opacity-20 min-h-[400px]"
                        value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                      />
                      
                      {/* DYNAMIC FOOTER */}
                      <footer className="mt-16 pt-12 border-t border-stone-900/10 text-center">
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] mb-3">{companyName}</p>
                         <p className="text-[8px] text-stone-400 uppercase tracking-[0.3em] font-medium">Powered by TOTS-OS</p>
                      </footer>
                    </div>

                    <div className="flex justify-center mt-12">
                        <button 
                        onClick={() => setStep('schedule')}
                        className="bg-stone-900 px-24 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] text-[var(--brand-primary)] shadow-2xl hover:scale-105 transition-all"
                        >
                        Schedule Release
                        </button>
                    </div>
                  </div>
                )}

                {step === 'schedule' && (
                  <div className="w-full max-w-2xl mx-auto bg-white p-16 rounded-[4rem] border border-stone-200 shadow-2xl text-center">
                     <Users size={32} className="mx-auto mb-6 text-stone-200" />
                     <h2 className="text-4xl font-serif italic text-stone-800 mb-8">Logistics</h2>
                     <div className="space-y-8 text-left mb-12">
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-3 block ml-1">Target Segment</label>
                         <select value={form.list_id} onChange={e => setForm({...form, list_id: e.target.value})} className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:border-stone-900">
                           <option value="">Select segment...</option>
                           {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-3 block ml-1">Transmission Time</label>
                         <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:border-stone-900" />
                       </div>
                     </div>
                     <div className="flex justify-center gap-4">
                       <button onClick={() => setStep('editor')} className="px-10 py-5 rounded-2xl bg-stone-100 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all">Back to Editor</button>
                       <button 
                        onClick={handleSchedule} 
                        className="px-12 py-5 rounded-2xl bg-stone-900 text-[var(--brand-primary)] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:brightness-110"
                       >
                         <CalendarIcon size={16}/> Establish Schedule
                       </button>
                     </div>
                  </div>
                )}
              </div>
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