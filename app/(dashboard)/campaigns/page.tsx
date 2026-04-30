"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, User
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)");
      const { data: listRes } = await supabase.from("subscriber_lists").select("*");
      setCampaigns(camps || []);
      setLists(listRes || []);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 text-stone-900">
      
      {/* PAGE HEADER */}
      <header className="max-w-7xl mx-auto flex justify-between items-end mb-16 border-b border-stone-100 pb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-3">Communications</p>
          <h1 className="text-7xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#a9b897] text-stone-900 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-[#98a886] transition-colors shadow-sm"
        >
          <Plus size={18} /> New Dispatch
        </button>
      </header>

      {/* DASHBOARD GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Live Queue</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[3.5rem] p-24 text-center">
              <p className="font-serif italic text-stone-200 text-2xl">Horizon Clear.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white p-10 rounded-[3rem] border border-stone-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-8">
                  <div className="p-5 bg-stone-50 rounded-2xl text-[#a9b897]"><Clock size={24} /></div>
                  <div>
                    <h3 className="font-bold text-xl text-stone-800">{c.title}</h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{c.subscriber_lists?.name}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest px-6 py-2 bg-stone-50 rounded-full text-[#a9b897] border border-stone-100">{c.status}</div>
              </div>
            ))
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-stone-900 rounded-[3.5rem] p-12 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-500 mb-10">Segments</p>
            <div className="space-y-6">
              {lists.map(l => (
                <div key={l.id} className="flex justify-between items-center border-b border-stone-800 pb-4 text-xs font-bold tracking-widest uppercase">
                  {l.name}
                  <div className="h-2 w-2 rounded-full bg-[#a9b897]" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL - Fixed Contrast and Visibility */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-stone-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-stone-50 w-full max-w-[1400px] h-full rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
            >
              {/* SIDEBAR */}
              <div className="w-80 bg-stone-50 border-r border-stone-200 p-12 flex flex-col shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10">Structure</p>
                <div className="space-y-3 mb-12">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.template_id === t.id ? 'bg-[#a9b897] text-stone-900 shadow-lg' : 'bg-white text-stone-400 hover:text-stone-600 border border-stone-100'}`}
                    >
                      {t.icon} {t.name}
                    </button>
                  ))}
                </div>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full bg-[#cbd5c0] text-stone-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* EDITOR CANVAS */}
              <div className="flex-1 bg-white p-8 md:p-16 overflow-y-auto flex flex-col items-center">
                <div className="w-full max-w-3xl flex justify-end mb-8">
                  <button 
                    onClick={() => setIsEnhancing(true)}
                    className="bg-[#a9b897] text-stone-900 px-6 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                  >
                    {isEnhancing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} 
                    Clarity Engine
                  </button>
                </div>
                
                {/* THE EMAIL SHEET */}
                <div className="bg-[#faf9f6] w-full max-w-3xl min-h-[800px] rounded-[3.5rem] border border-stone-200 p-20 flex flex-col shadow-inner">
                  <input 
                    placeholder="Subject Line..." 
                    className="text-5xl font-serif italic text-stone-800 outline-none mb-10 bg-transparent placeholder:text-stone-200 border-b border-stone-100 pb-4"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                  />
                  <textarea 
                    placeholder="Commence transmission..."
                    className="flex-1 text-xl font-serif italic text-stone-600 leading-relaxed outline-none resize-none bg-transparent placeholder:text-stone-200"
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                  />
                </div>

                <div className="mt-12">
                  <button 
                    className="bg-stone-900 text-[#a9b897] px-24 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl hover:scale-105 transition-transform"
                  >
                    Schedule Dispatch
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