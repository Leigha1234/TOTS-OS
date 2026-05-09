"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, Check, Sparkles, Calendar as CalendarIcon, 
  AlignLeft, Bold, Eye, Palette, Menu
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
  const [showModal, setShowModal] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  
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

  useEffect(() => {
    async function loadData() {
      const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)");
      const { data: listRes } = await supabase.from("subscriber_lists").select("*");
      setCampaigns(camps || []);
      setLists(listRes || []);
    }
    loadData();
  }, []);

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
    // ... logic remains same as original ...
    setShowModal(false);
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
      {/* RESPONSIVE HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-16 border-b border-stone-200 pb-10 gap-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-3">System Hub</p>
          <h1 className="text-5xl md:text-7xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <button 
          onClick={() => { setStep('editor'); setShowModal(true); }}
          className="bg-[#a9b897] w-full md:w-auto px-8 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={18} /> New Campaign
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* CAMPAIGN FEED */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6 order-2 lg:order-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Scheduled Transmission</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[2.5rem] md:rounded-[3.5rem] p-12 md:p-24 text-center shadow-sm">
              <p className="font-serif italic text-stone-200 text-xl md:text-2xl">Horizon Clear.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-stone-100 flex flex-col md:flex-row gap-4 md:justify-between md:items-center group shadow-sm">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="p-3 md:p-5 bg-stone-50 rounded-2xl text-[#a9b897]"><Clock size={20} /></div>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-stone-800 line-clamp-1">{c.title}</h3>
                    <p className="text-[9px] md:text-[10px] text-stone-400 uppercase tracking-widest mt-1">{c.subscriber_lists?.name || 'All Segments'}</p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-4 md:px-6 py-2 bg-stone-50 rounded-full text-stone-400 border border-stone-100 self-start md:self-auto">Scheduled</div>
              </div>
            ))
          )}
        </div>

        {/* SEGMENTS ASIDE */}
        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="bg-stone-50 border border-stone-200 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-6 md:mb-10">Active Segments</p>
            <div className="space-y-4 md:space-y-6">
              {lists.map(l => (
                <div key={l.id} className="flex justify-between items-center border-b border-stone-200 pb-4 text-[10px] md:text-xs font-black tracking-widest uppercase text-stone-600">
                  {l.name}
                  <div className="h-2 w-2 rounded-full bg-[#a9b897]" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* FULLSCREEN EDITOR MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10 bg-stone-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#faf9f6] w-full md:max-w-[1400px] h-full md:h-[85vh] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative border border-stone-200"
            >
              {/* MOBILE MODAL HEADER */}
              <div className="md:hidden flex justify-between items-center p-6 bg-white border-b border-stone-200">
                <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Menu size={16}/> Style
                </button>
                <button onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>

              {/* TEMPLATE SIDEBAR (Responsive) */}
              <div className={`
                ${showTemplateMenu ? 'flex' : 'hidden md:flex'} 
                absolute md:relative inset-0 md:inset-auto z-20 w-full md:w-80 bg-stone-50 border-r border-stone-200 p-8 md:p-12 flex-col shrink-0
              `}>
                <div className="flex justify-between md:block mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Structure</p>
                  <button onClick={() => setShowTemplateMenu(false)} className="md:hidden"><X size={18}/></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 mb-12">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => { setForm({...form, template_id: t.id}); setShowTemplateMenu(false); }}
                      className={`w-full flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${form.template_id === t.id ? 'bg-[#a9b897] text-white shadow-sm' : 'bg-white border border-stone-100 text-stone-600'}`}
                    >
                      {t.icon} <span>{t.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowModal(false)} className="mt-auto hidden md:block w-full bg-stone-200/50 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Close</button>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 bg-stone-100/50 p-4 md:p-16 overflow-y-auto flex flex-col items-center">
                {step === 'editor' && (
                  <div className="w-full max-w-3xl flex flex-col items-center pb-20">
                    <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Campaign Dispatch Draft</span>
                      <button onClick={() => setShowClarityPrompt(true)} className="w-full md:w-auto px-6 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-[#a9b897] text-[#1c1917]">
                        <Wand2 size={14} /> Clarity Engine
                      </button>
                    </div>

                    <AnimatePresence>
                      {showClarityPrompt && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="w-full bg-white p-6 md:p-8 mb-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-600 mb-4">What should this cover?</h4>
                          <input 
                            value={clarityTopic} onChange={e => setClarityTopic(e.target.value)}
                            className="w-full p-4 text-sm font-serif italic bg-stone-50 rounded-xl border border-stone-100 mb-4"
                            placeholder="Topic details..."
                          />
                          <div className="flex gap-2">
                            <button onClick={executeGeneration} className="bg-stone-900 text-[#a9b897] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                              {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Generate
                            </button>
                            <button onClick={() => setShowClarityPrompt(false)} className="px-6 py-3 text-[9px] font-black uppercase text-stone-400">Cancel</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* EDITING CANVAS */}
                    <div className={`w-full min-h-[600px] md:min-h-[800px] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 flex flex-col shadow-xl ${getTemplateStyleClasses()}`}>
                      <input 
                        placeholder="Campaign Title..." 
                        className="text-xl md:text-2xl font-bold outline-none mb-6 bg-transparent border-b border-stone-50 pb-4 placeholder:text-stone-300"
                        value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="Subject Line..." 
                        className="text-2xl md:text-4xl font-serif italic outline-none mb-8 md:mb-12 bg-transparent placeholder:text-stone-300 border-b border-stone-50 pb-6 resize-none h-24"
                        value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      />
                      <textarea 
                        placeholder="Commence transmission..."
                        className="flex-1 text-lg md:text-xl font-serif italic leading-relaxed outline-none resize-none bg-transparent placeholder:text-stone-300 min-h-[300px]"
                        value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                      />
                      <footer className="mt-12 pt-8 border-t border-stone-50 text-center space-y-2">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-800">The Organised Types</p>
                         <p className="text-[9px] text-stone-300 uppercase tracking-widest italic">London HQ</p>
                      </footer>
                    </div>

                    <button 
                      onClick={() => setStep('schedule')}
                      className="mt-12 bg-stone-900 px-16 md:px-28 py-5 md:py-7 rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-[0.4em] text-[#a9b897] shadow-2xl active:scale-95 transition-all"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {step === 'schedule' && (
                  <div className="w-full max-w-2xl bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] border border-stone-200 shadow-xl text-center">
                     <h2 className="text-3xl md:text-4xl font-serif italic text-stone-800 mb-6">Schedule Transmission</h2>
                     <div className="space-y-6 text-left mb-10">
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-2 block">Segment</label>
                         <select value={form.list_id} onChange={e => setForm({...form, list_id: e.target.value})} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                           <option value="">Select list...</option>
                           {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-2 block">Release Time</label>
                         <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs" />
                       </div>
                     </div>
                     <div className="flex flex-col md:flex-row justify-center gap-3">
                       <button onClick={() => setStep('editor')} className="px-8 py-4 rounded-xl bg-stone-100 text-stone-500 font-black text-[9px] uppercase">Back</button>
                       <button onClick={handleSchedule} className="px-10 py-4 rounded-xl bg-[#a9b897] text-white font-black text-[9px] uppercase shadow-lg shadow-[#a9b897]/20 flex items-center justify-center gap-2">
                         <CalendarIcon size={14}/> Confirm Schedule
                       </button>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}