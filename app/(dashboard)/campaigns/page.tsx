"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, User, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={14}/> },
  { id: 'visual', name: 'Visual', icon: <ImageIcon size={14}/> },
  { id: 'letter', name: 'Founder', icon: <User size={14}/> },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [didEnhance, setDidEnhance] = useState(false);
  
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

  const applyClarity = () => {
    if (!form.content || isEnhancing) return;
    setIsEnhancing(true);
    
    setTimeout(() => {
      setForm(prev => ({ 
        ...prev, 
        content: prev.content
          .replace(/\b(just|actually|really|basically|simply|maybe)\b/gi, "")
          .replace(/\b(help)\b/gi, "facilitate")
          .replace(/\b(get in touch|contact us)\b/gi, "initiate correspondence")
          .replace(/\s\s+/g, ' ')
          .trim()
      }));
      setIsEnhancing(false);
      setDidEnhance(true);
      setTimeout(() => setDidEnhance(false), 2000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 text-stone-900 font-sans">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex justify-between items-end mb-16 border-b border-stone-200 pb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-3">System Hub</p>
          <h1 className="text-7xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#a9b897] px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-[#99a986] transition-all shadow-sm"
        >
          <span className="text-[#1c1917] flex items-center gap-3">
            <Plus size={18} /> New Dispatch
          </span>
        </button>
      </header>

      {/* MAIN DASHBOARD */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Scheduled Transmission</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[3.5rem] p-24 text-center shadow-sm">
              <p className="font-serif italic text-stone-200 text-2xl">Horizon Clear.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white p-10 rounded-[3rem] border border-stone-100 flex justify-between items-center group">
                <div className="flex items-center gap-8">
                  <div className="p-5 bg-stone-50 rounded-2xl text-[#a9b897]"><Clock size={24} /></div>
                  <div>
                    <h3 className="font-bold text-xl text-stone-800">{c.title}</h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{c.subscriber_lists?.name}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest px-6 py-2 bg-stone-50 rounded-full text-stone-400 border border-stone-100">Scheduled</div>
              </div>
            ))
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-stone-50 border border-stone-200 rounded-[3.5rem] p-12 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-10">Active Segments</p>
            <div className="space-y-6">
              {lists.map(l => (
                <div key={l.id} className="flex justify-between items-center border-b border-stone-100 pb-5 text-xs font-black tracking-widest uppercase text-stone-600">
                  {l.name}
                  <div className="h-2 w-2 rounded-full bg-[#a9b897]" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-stone-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#faf9f6] w-full max-w-[1400px] h-full rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative border border-stone-200"
            >
              {/* SIDEBAR */}
              <div className="w-80 bg-stone-50 border-r border-stone-200 p-12 flex flex-col shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10">Structure</p>
                <div className="space-y-4 mb-12">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        form.template_id === t.id 
                          ? 'bg-[#a9b897] shadow-md text-[#1c1917]' 
                          : 'bg-white text-stone-400 border border-stone-100'
                      }`}
                    >
                      {t.icon} <span className={form.template_id === t.id ? "text-[#1c1917]" : "text-stone-400"}>{t.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full bg-[#cbd5c0] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b8c4aa] transition-all"
                  >
                    <span className="text-[#1c1917]">Cancel</span>
                  </button>
                </div>
              </div>

              {/* EDITOR */}
              <div className="flex-1 bg-stone-200/30 p-8 md:p-16 overflow-y-auto flex flex-col items-center">
                <div className="w-full max-w-3xl flex justify-between items-center mb-10">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Dispatch Draft</span>
                  <button 
                    onClick={applyClarity}
                    className={`px-8 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${didEnhance ? 'bg-white' : 'bg-[#a9b897]'}`}
                  >
                    <span className={`${didEnhance ? 'text-green-700' : 'text-[#1c1917]'} flex items-center gap-2`}>
                      {isEnhancing ? <Loader2 size={14} className="animate-spin text-[#1c1917]" /> : didEnhance ? <Check size={14} /> : <Wand2 size={14} />} 
                      {didEnhance ? "Refined" : "Clarity Engine"}
                    </span>
                  </button>
                </div>
                
                <div className="bg-white w-full max-w-3xl min-h-[900px] rounded-[4rem] border border-stone-200 p-24 flex flex-col shadow-xl">
                  <input 
                    placeholder="Subject Line..." 
                    className="text-5xl font-serif italic text-stone-800 outline-none mb-12 bg-transparent placeholder:text-stone-100 border-b border-stone-50 pb-6"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                  />
                  <textarea 
                    placeholder="Commence transmission..."
                    className="flex-1 text-2xl font-serif italic text-stone-600 leading-relaxed outline-none resize-none bg-transparent placeholder:text-stone-100"
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                  />
                  
                  <footer className="mt-20 pt-10 border-t border-stone-50 flex flex-col items-center gap-3">
                     <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-800">The Organised Types</p>
                     <p className="text-[10px] text-stone-300 uppercase tracking-widest italic">London HQ</p>
                  </footer>
                </div>

                <div className="mt-16 pb-12">
                  <button 
                    className="bg-stone-900 px-28 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:scale-105 transition-transform"
                  >
                    <span className="text-[#a9b897]">Schedule Dispatch</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}