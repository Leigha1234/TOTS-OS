"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  ShoppingBag, FileText, Wand2, Upload, User, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={14}/> },
  { id: 'visual', name: 'Visual', icon: <ImageIcon size={14}/> },
  { id: 'letter', name: 'Founder', icon: <User size={14}/> },
];

export default function CampaignsPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (mem?.team_id) {
        setTeamId(mem.team_id);
        const { data: camps } = await supabase.from("campaigns").select("*, subscriber_lists(name)").eq("team_id", mem.team_id);
        const { data: listRes } = await supabase.from("subscriber_lists").select("*").eq("team_id", mem.team_id);
        setCampaigns(camps || []);
        setLists(listRes || []);
      }
    }
    init();
  }, []);

  const applyClarity = () => {
    if (!form.content || isEnhancing) return;
    setIsEnhancing(true);
    setTimeout(() => {
      const refined = form.content
        .replace(/\b(just|actually|really)\b/gi, "")
        .replace(/\b(help)\b/gi, "facilitate")
        .trim();
      setForm(prev => ({ ...prev, content: refined }));
      setIsEnhancing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-6 md:p-12 text-stone-900">
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto flex justify-between items-end mb-16 border-b border-stone-100 pb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Communications Hub</p>
          <h1 className="text-7xl font-serif italic text-stone-800 tracking-tighter leading-none">Campaigns</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#a9b897] text-[#faf9f6] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-[#a9b897]/20"
        >
          <Plus size={16} /> New Dispatch
        </button>
      </header>

      {/* MAIN CONTENT GRID - Fixed to prevent overlaps */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: QUEUE */}
        <div className="lg:col-span-8 space-y-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 ml-4">Scheduled Queue</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[3rem] p-20 text-center shadow-sm">
              <p className="font-serif italic text-stone-300 text-lg">Horizon is currently clear.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-50 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-50 rounded-2xl text-[#a9b897]"><Clock size={20} /></div>
                  <div>
                    <h3 className="font-bold text-stone-800">{c.title}</h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">{c.subscriber_lists?.name}</p>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-stone-50 rounded-full text-[#a9b897]">{c.status}</div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: SEGMENTS - No longer absolute/overlapping */}
        <aside className="lg:col-span-4">
          <div className="bg-stone-900 rounded-[3rem] p-10 text-[#faf9f6] shadow-xl min-h-[300px]">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500 mb-8">Active Segments</p>
            <div className="space-y-4">
              {lists.map(l => (
                <div key={l.id} className="flex justify-between items-center border-b border-stone-800 pb-4 text-[11px] font-bold tracking-tight">
                  {l.name}
                  <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897]" />
                </div>
              ))}
              {lists.length === 0 && <p className="text-stone-600 italic text-xs">No segments found.</p>}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL - Standardized contrast */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-2xl flex overflow-hidden relative border border-stone-200"
            >
              {/* Sidebar controls */}
              <div className="w-72 bg-stone-50 border-r border-stone-100 p-10 flex flex-col shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8">Structure</p>
                <div className="space-y-2 mb-12">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setForm({...form, template_id: t.id})}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.template_id === t.id ? 'bg-white shadow-sm text-[#a9b897] border border-stone-100' : 'text-stone-300'}`}
                    >
                      {t.icon} {t.name}
                    </button>
                  ))}
                </div>
                <div className="mt-auto">
                  <button onClick={() => setShowModal(false)} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-800">Cancel</button>
                </div>
              </div>

              {/* Editor Canvas */}
              <div className="flex-1 bg-[#fcfbf9] p-12 overflow-y-auto flex flex-col items-center">
                <div className="w-full max-w-2xl flex justify-end mb-6">
                  <button 
                    onClick={applyClarity}
                    className="flex items-center gap-2 px-5 py-2 bg-white rounded-full shadow-sm text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-[#a9b897] transition-colors"
                  >
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Clarity Engine
                  </button>
                </div>
                
                <div className="bg-white w-full max-w-2xl min-h-[700px] rounded-[3rem] shadow-sm border border-stone-100 p-16 flex flex-col">
                  <input 
                    placeholder="Subject Line..." 
                    className="text-4xl font-serif italic text-stone-800 outline-none mb-8 placeholder:text-stone-100"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                  />
                  <textarea 
                    placeholder="Commence transmission..."
                    className="flex-1 text-lg font-serif italic text-stone-600 leading-relaxed outline-none resize-none placeholder:text-stone-100"
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                  />
                  
                  <footer className="mt-12 pt-8 border-t border-stone-50 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-800">{branding.company_name}</p>
                    <p className="text-[9px] text-stone-300 uppercase tracking-widest italic">{branding.contact_details}</p>
                  </footer>
                </div>

                <div className="mt-10">
                  <button 
                    className="bg-stone-900 text-[#a9b897] px-16 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all"
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