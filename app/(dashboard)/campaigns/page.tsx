"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, User, Check, Sparkles, Calendar as CalendarIcon, Hash, Edit3, AlignLeft, Bold, Eye, Palette, Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalist', icon: <Type size={14}/> },
  { id: 'creative', name: 'Creative', icon: <Sparkles size={14}/> },
  { id: 'bold', name: 'Bold', icon: <Bold size={14}/> },
  { id: 'colorful', name: 'Colorful', icon: <Palette size={14}/> },
  { id: 'elegant', name: 'Elegant', icon: <AlignLeft size={14}/> },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [didEnhance, setDidEnhance] = useState(false);
  
  // States for sub-forms and date wizard
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

  const applyClarity = () => {
    setShowClarityPrompt(true);
  };

  const executeGeneration = () => {
    if (!clarityTopic) return;
    setIsGenerating(true);
    
    // Simulate generation with the selected style type
    setTimeout(() => {
      const selectedStyle = TEMPLATES.find(t => t.id === form.template_id)?.name || "Minimalist";
      setForm(prev => ({ 
        ...prev, 
        subject: `News: ${clarityTopic.split(' ').slice(0, 3).join(' ')}`,
        content: `Dear Reader,\n\nHere is our summary covering the latest on ${clarityTopic} using the ${selectedStyle} style type. We have curated the key highlights, resources, and next steps for your operations.\n\nBest regards,\nLondon HQ`
      }));
      setIsGenerating(false);
      setShowClarityPrompt(false);
      setClarityTopic("");
      setDidEnhance(true);
      setTimeout(() => setDidEnhance(false), 2000);
    }, 1500);
  };

  const handleSchedule = async () => {
    if (!form.scheduled_for) {
      alert("Please select a valid date/time before scheduling.");
      return;
    }

    try {
      // Payload compatible with both the app and the schema definitions
      const { error } = await supabase.from("campaigns").insert([{
        title: form.title || form.subject || "New Campaign",
        subject: form.subject,
        status: "scheduled",
        created_at: new Date().toISOString(),
        scheduled_for: form.scheduled_for,
      }]);

      if (error) throw error;

      // Automatically update the calendar table for tracking
      await supabase.from("tasks").insert([{
        title: form.title || form.subject || "Campaign Dispatch",
        user_id: (await supabase.auth.getUser()).data.user?.id,
        created_at: form.scheduled_for,
        description: form.content || "",
        status: "todo",
        priority: 1,
        color: "#a9b897",
        location: "Campaign Hub Dispatch"
      }]);

      alert("Campaign scheduled successfully and added to the calendar!");
      setShowModal(false);
      setStep('editor');
    } catch (err: any) {
      alert("Error scheduling campaign: " + err.message);
    }
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
          onClick={() => { setStep('editor'); setShowModal(true); }}
          className="bg-[#a9b897] px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-[#99a986] transition-all shadow-sm"
        >
          <span className="text-[#1c1917] flex items-center gap-3">
            <Plus size={18} /> New Campaign
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
              className="bg-[#faf9f6] w-full max-w-[1400px] h-[85vh] rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative border border-stone-200"
            >
              {/* SIDEBAR */}
              <div className="w-80 bg-stone-50 border-r border-stone-200 p-12 flex flex-col shrink-0 justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10">Structure</p>
                  <div className="space-y-3 mb-12">
                    {TEMPLATES.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setForm({...form, template_id: t.id})}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          form.template_id === t.id 
                            ? 'bg-[#a9b897] shadow-md text-[#1c1917]' 
                            : 'bg-white text-stone-400 border border-stone-100'
                        }`}
                      >
                        {t.icon} <span className={form.template_id === t.id ? "text-[#1c1917]" : "text-stone-400"}>{t.name}</span>
                      </button>
                    ))}
                    
                    {/* Blank Template Option */}
                    <button 
                      onClick={() => setForm({...form, template_id: 'blank'})}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        form.template_id === 'blank' 
                          ? 'bg-[#a9b897] shadow-md text-[#1c1917]' 
                          : 'bg-white text-stone-400 border border-stone-100'
                      }`}
                    >
                      <Eye size={14}/> <span>Blank / Own</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => { setShowModal(false); setStep('editor'); }}
                    className="w-full bg-[#cbd5c0] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#b8c4aa] transition-all mb-4"
                  >
                    <span className="text-[#1c1917]">Cancel</span>
                  </button>
                </div>
              </div>

              {/* EDITOR OR SCHEDULE STEP */}
              <div className="flex-1 bg-stone-200/30 p-8 md:p-16 overflow-y-auto flex flex-col items-center">
                
                {step === 'editor' && (
                  <>
                    <div className="w-full max-w-3xl flex justify-between items-center mb-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Campaign Dispatch Draft</span>
                      <button 
                        onClick={applyClarity}
                        className={`px-8 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all bg-[#a9b897]`}
                      >
                        <span className="text-[#1c1917] flex items-center gap-2">
                          <Wand2 size={14} /> Clarity Engine
                        </span>
                      </button>
                    </div>

                    {showClarityPrompt && (
                      <div className="w-full max-w-3xl bg-white p-8 mb-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col gap-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-stone-600">What would you like the newsletter to cover?</h4>
                        <input 
                          value={clarityTopic}
                          onChange={e => setClarityTopic(e.target.value)}
                          placeholder="e.g. Q1 Growth, new staff arrivals, and corporate guidelines"
                          className="w-full p-4 text-xs font-serif italic bg-stone-50 rounded-2xl border border-stone-100 focus:outline-none focus:ring-2 ring-[#a9b897]/30"
                        />
                        <div className="flex gap-3 mt-2">
                          <button 
                            onClick={executeGeneration}
                            className="bg-[#a9b897] text-[#1c1917] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"
                          >
                            {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            Generate Draft
                          </button>
                          <button 
                            onClick={() => setShowClarityPrompt(false)}
                            className="bg-stone-50 border border-stone-100 text-stone-500 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white w-full max-w-3xl min-h-[800px] rounded-[4rem] border border-stone-200 p-20 flex flex-col shadow-xl">
                      <input 
                        placeholder="Campaign Title / Name..." 
                        className="text-2xl font-bold text-stone-800 outline-none mb-8 bg-transparent border-b border-stone-50 pb-4 placeholder:text-stone-300"
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                      />
                      <input 
                        placeholder="Subject Line..." 
                        className="text-4xl font-serif italic text-stone-800 outline-none mb-12 bg-transparent placeholder:text-stone-300 border-b border-stone-50 pb-6"
                        value={form.subject}
                        onChange={e => setForm({...form, subject: e.target.value})}
                      />
                      <textarea 
                        placeholder="Commence transmission..."
                        className="flex-1 text-xl font-serif italic text-stone-600 leading-relaxed outline-none resize-none bg-transparent placeholder:text-stone-200"
                        value={form.content}
                        onChange={e => setForm({...form, content: e.target.value})}
                      />
                      
                      <footer className="mt-16 pt-10 border-t border-stone-50 flex flex-col items-center gap-3">
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-800">The Organised Types</p>
                         <p className="text-[10px] text-stone-300 uppercase tracking-widest italic">London HQ</p>
                      </footer>
                    </div>

                    <div className="mt-16 pb-12">
                      <button 
                        onClick={() => setStep('schedule')}
                        className="bg-stone-900 px-28 py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:scale-105 transition-transform text-[#a9b897]"
                      >
                        Schedule
                      </button>
                    </div>
                  </>
                )}

                {step === 'schedule' && (
                  <div className="w-full max-w-2xl bg-white p-16 rounded-[3.5rem] border border-stone-200 shadow-xl mt-16 text-center">
                     <h2 className="text-4xl font-serif italic text-stone-800 mb-6">Schedule Campaign Dispatch</h2>
                     <p className="text-xs uppercase tracking-widest text-stone-400 max-w-md mx-auto mb-10 leading-relaxed">
                       Choose a date and time for when your transmission should go live. It will populate in your calendar.
                     </p>

                     <div className="flex flex-col gap-6 max-w-md mx-auto mb-12">
                       <div>
                         <label className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 block mb-2 text-left">Transmission Date</label>
                         <input 
                           type="datetime-local" 
                           value={form.scheduled_for}
                           onChange={e => setForm({...form, scheduled_for: e.target.value})}
                           className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-600 focus:outline-none focus:ring-2 ring-[#a9b897]/30"
                         />
                       </div>
                     </div>

                     <div className="flex justify-center gap-4">
                       <button 
                         onClick={() => setStep('editor')}
                         className="px-8 py-5 rounded-2xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all font-black text-[9px] uppercase tracking-[0.2em]"
                       >
                         Back
                       </button>
                       <button 
                         onClick={handleSchedule}
                         className="px-12 py-5 rounded-2xl bg-[#a9b897] text-white hover:bg-[#99a986] transition-all font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-[#a9b897]/20 flex items-center gap-2"
                       >
                         <CalendarIcon size={14}/> Confirm and Schedule
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