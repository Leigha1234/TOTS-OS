"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Plus, X, Clock, Type, Image as ImageIcon, 
  Wand2, Loader2, Check, Sparkles, Calendar as CalendarIcon, 
  AlignLeft, Bold, Eye, Palette, Menu, Users, Hash, Radio, Zap,
  Mail, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function useCampaigns(supabase: any) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("Your Company");
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  // Get org context
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: team, error: teamError } = await supabase
        .from("team")
        .select("organisation_id, company_name, name")
        .limit(1)
        .maybeSingle();

      console.log("Team record:", team);
      console.log("Team error:", teamError);

      if (team?.organisation_id) {
        setCompanyName(team.company_name || team.name || "Your Company");
        setOrganisationId(team.organisation_id);
      }
    };

    init();
  }, [supabase]);

  // Load data once org is ready
  useEffect(() => {
    if (!organisationId) return;

    const load = async () => {
      console.log("Loading campaigns for organisation:", organisationId);
      const { data: camps } = await supabase
        .from("campaigns")
        .select("*, subscriber_lists(name)")
        .eq("organisation_id", organisationId);

      const { data: listRes, error: listError } = await supabase
        .from("subscriber_lists")
        .select("*")
        .eq("organisation_id", organisationId);

      console.log("Subscriber lists:", listRes);
      console.log("Subscriber list error:", listError);

      setCampaigns(camps || []);
      setLists(Array.isArray(listRes) ? listRes : []);
    };

    load();
  }, [organisationId, supabase]);

  // Create list
  const createList = async (name: string) => {
    if (!organisationId || !name) return;

    await supabase.from("subscriber_lists").insert({
      name,
      organisation_id: organisationId
    });

    // refresh
    const { data } = await supabase
      .from("subscriber_lists")
      .select("*")
      .eq("organisation_id", organisationId);

    setLists(data || []);
  };

  // Schedule campaign
  const scheduleCampaign = async (form: any) => {
    if (!organisationId) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("campaigns").insert({
      ...form,
      user_id: user?.id,
      organisation_id: organisationId
    });

    // refresh
    const { data: camps } = await supabase
      .from("campaigns")
      .select("*, subscriber_lists(name)")
      .eq("organisation_id", organisationId);

    setCampaigns(camps || []);
  };

  return {
    campaigns,
    lists,
    companyName,
    organisationId,
    createList,
    scheduleCampaign
  };
}

export default function CampaignsPage() {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const {
    campaigns,
    lists,
    companyName,
    organisationId,
    createList,
    scheduleCampaign
  } = useCampaigns(supabase);

  // UI STATE
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const [step, setStep] = useState<'editor' | 'schedule'>('editor');

  const [newListName, setNewListName] = useState("");

  const [showClarityPrompt, setShowClarityPrompt] = useState(false);
  const [clarityTopic, setClarityTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    list_id: "",
    scheduled_for: "",
    content: ""
  });

  // AI generation helper
  const executeGeneration = () => {
    if (!clarityTopic) return;
    setIsGenerating(true);

    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        subject: `Update: ${clarityTopic.split(' ').slice(0, 3).join(' ')}`,
        content: `Dear Team,\n\nFollowing up on our campaign goals regarding ${clarityTopic}.`
      }));
      setIsGenerating(false);
      setShowClarityPrompt(false);
    }, 1500);
  };

  const formatScheduledDate = (dateString: string) => {
    if (!dateString) return "Immediate Release";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-12 text-stone-900 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-16 border-b border-stone-200 pb-10 gap-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)] mb-3 opacity-80">Campaign Dashboard</p>
          <h1 className="text-5xl md:text-7xl font-serif italic text-stone-800 tracking-tighter">Campaigns</h1>
        </div>
        <button 
          onClick={() => {
            setStep('editor');
            setShowModal(true);
          }}
          className="bg-stone-900 text-[var(--brand-primary)] w-full md:w-auto px-8 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:brightness-110 transition-all"
        >
          <Plus size={18} /> Create Campaign
        </button>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* PIPELINE FEED WITH ENHANCED DETAILS */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Campaign Status Pipeline</p>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-[3.5rem] p-24 text-center shadow-sm">
              <p className="font-serif italic text-stone-200 text-2xl">No campaigns scheduled at this time.</p>
            </div>
          ) : (
            campaigns.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setSelectedCampaign(c); setShowViewModal(true); }}
                className="bg-white p-8 rounded-[3rem] border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-6 flex-1 min-w-0">
                  <div className="p-5 bg-stone-50 rounded-2xl text-[var(--brand-primary)] shrink-0">
                    <Radio size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-xl text-stone-800 uppercase tracking-tight truncate">{c.title}</h3>
                      <span className="text-[9px] px-3 py-1 bg-stone-100 rounded-full font-black text-stone-500 uppercase tracking-wider">
                        {c.subscriber_lists?.name || 'Unassigned List'}
                      </span>
                    </div>
                    <p className="text-xs font-serif italic text-stone-500 truncate block">
                      Subject: {c.subject || "No Subject Specified"}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-stone-400 pt-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatScheduledDate(c.scheduled_for)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest px-6 py-2 bg-stone-50 rounded-full text-stone-400 border border-stone-100 self-start md:self-auto text-center">
                  Queued
                </div>
              </div>
            ))
          )}
        </div>

        {/* SEGMENTS ASIDE */}
        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="bg-stone-50 border border-stone-200 rounded-[3.5rem] p-12 shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--brand-primary)]">Campaign Lists</p>
                <button onClick={() => setShowListModal(true)} className="p-2 bg-white rounded-full border border-stone-200 hover:bg-stone-100 transition-colors"><Plus size={14}/></button>
            </div>
            <div className="space-y-6">
              {lists.map(l => (
                <div key={l.id} className="flex justify-between items-center border-b border-stone-200 pb-4 text-[10px] font-black tracking-widest uppercase text-stone-600">
                  {l.name}
                  <Hash size={10} className="text-stone-300" />
                </div>
              ))}
              {lists.length === 0 && <p className="text-[10px] font-serif italic text-stone-400">No subscriber lists created yet.</p>}
            </div>
          </div>
        </aside>
      </div>

      {/* DETAILED CAMPAIGN VIEW MODAL */}
      <AnimatePresence>
        {showViewModal && selectedCampaign && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10 bg-stone-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf9f6] w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]"
            >
              {/* TOP PROFILE HEADER */}
              <div className="p-8 md:p-12 border-b border-stone-200 bg-stone-50 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1 bg-stone-900 text-[var(--brand-primary)] rounded-full">
                      Campaign Profile
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1 bg-white border border-stone-200 text-stone-500 rounded-full">
                      {selectedCampaign.subscriber_lists?.name || 'Unassigned Target'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-stone-800 uppercase tracking-tight">{selectedCampaign.title}</h2>
                </div>
                <button 
                  onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }} 
                  className="p-3 bg-white hover:bg-stone-100 border border-stone-200 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* DETAILS METADATA BODY */}
              <div className="p-8 md:p-12 overflow-y-auto no-scrollbar space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-stone-100 pb-6 text-xs">
                  <div>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-1">Scheduled Time</p>
                    <p className="font-bold text-stone-800 flex items-center gap-2"><Clock size={14} className="text-stone-400" /> {formatScheduledDate(selectedCampaign.scheduled_for)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-1">Company Name</p>
                    <p className="font-bold text-stone-800 flex items-center gap-2"><Users size={14} className="text-stone-400" /> {companyName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-2">Subject Line</p>
                  <div className="p-5 bg-white rounded-2xl border border-stone-100 text-lg font-serif italic text-stone-900 shadow-inner">
                    {selectedCampaign.subject || "No Subject Specified"}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider mb-2">Email Content Output</p>
                  <div className="p-8 md:p-10 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm font-serif text-stone-800 leading-relaxed text-base whitespace-pre-wrap min-h-[200px]">
                    {selectedCampaign.content || "Empty content payload."}
                  </div>
                </div>
              </div>

              {/* VIEW FOOTER */}
              <div className="p-6 bg-stone-50 border-t border-stone-200 text-center flex justify-end">
                <button 
                  onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }}
                  className="px-8 py-4 bg-stone-900 text-[var(--brand-primary)] rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE LIST MODAL */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl border border-stone-200 relative">
                {/* Close Button Top Right */}
                <button 
                  onClick={() => setShowListModal(false)}
                  className="absolute top-8 right-8 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>

                <h3 className="text-2xl font-serif italic mb-6">Create Campaign List</h3>
                <input 
                    value={newListName} onChange={e => setNewListName(e.target.value)}
                    placeholder="Segment Name (e.g. Investors)" 
                    className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-6 outline-none focus:border-stone-900"
                />
                <div className="flex gap-3">
                    <button onClick={() => createList(newListName)} className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Create List</button>
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
              className="bg-[#faf9f6] w-full md:max-w-[1400px] h-full md:h-[85vh] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-stone-200 relative"
            >
              {/* Close Button Top Right */}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] p-3 bg-white hover:bg-stone-100 border border-stone-200 rounded-full text-stone-700 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>

              {/* ACTIONS SIDEBAR */}
              <div className="w-full md:w-80 bg-stone-50 border-r border-stone-200 p-12 flex flex-col shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8">Campaign Control</p>
                <div className="mb-4 p-4 bg-white border border-stone-100 rounded-2xl">
                  <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider mb-1">Company Name</p>
                  <p className="text-xs font-bold text-stone-800 uppercase tracking-tight truncate">{companyName}</p>
                </div>
              </div>

              {/* EDITOR */}
              <div className="flex-1 bg-stone-100/30 p-8 md:p-16 overflow-y-auto no-scrollbar">
                {step === 'editor' && (
                  <div className="w-full max-w-3xl mx-auto pb-20">
                    <div className="flex justify-between items-center mb-10 pr-14 md:pr-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Campaign Content Draft</span>
                      <button onClick={() => setShowClarityPrompt(true)} className="px-6 py-3 rounded-full shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-stone-900 text-[var(--brand-primary)]">
                        <Zap size={14} fill="var(--brand-primary)" /> AI Content Assistant
                      </button>
                    </div>

                    <AnimatePresence>
                      {showClarityPrompt && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="relative w-full bg-stone-900 text-white p-8 mb-10 rounded-[3rem] border border-[var(--brand-primary)]/20 shadow-sm overflow-hidden">
                          <button 
                            onClick={() => setShowClarityPrompt(false)} 
                            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-white rounded-full transition-colors"
                          >
                            <X size={16} />
                          </button>

                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] mb-4">Campaign Objectives</h4>
                          <input 
                            value={clarityTopic} onChange={e => setClarityTopic(e.target.value)}
                            className="w-full p-5 text-sm font-serif italic bg-white/5 rounded-2xl border border-white/10 mb-4 outline-none text-white placeholder:text-stone-500"
                            placeholder="Specify the campaign intent..."
                          />
                          <div className="flex gap-2">
                            <button onClick={executeGeneration} className="bg-[var(--brand-primary)] text-stone-900 px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                              {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Generate Content
                            </button>
                            <button onClick={() => setShowClarityPrompt(false)} className="px-6 py-3 text-[9px] font-black uppercase text-stone-400">Cancel</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="w-full min-h-[800px] rounded-[4rem] p-12 md:p-24 flex flex-col shadow-2xl transition-all duration-500 border border-stone-200 bg-white text-stone-600">
                      <input 
                        placeholder="Campaign Title..." 
                        className="text-xl font-bold outline-none mb-8 bg-transparent border-b border-stone-900/10 pb-4 placeholder:opacity-30 text-stone-900"
                        value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="Email Subject Line..." 
                        className="text-3xl md:text-5xl font-serif italic outline-none mb-12 bg-transparent placeholder:opacity-20 border-b border-stone-900/10 pb-8 resize-none h-32 leading-tight text-stone-900"
                        value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      />
                      <textarea 
                        placeholder="Compose your email content body here..."
                        className="flex-1 text-xl font-serif italic leading-relaxed outline-none resize-none bg-transparent placeholder:opacity-20 min-h-[400px] text-stone-700"
                        value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                      />
                      
                      {/* DYNAMIC FOOTER */}
                      <footer className="mt-16 pt-12 border-t border-stone-900/10 text-center">
                         <p className="text-[11px] font-black uppercase tracking-[0.5em] mb-3 text-stone-900">{companyName}</p>
                         <p className="text-[8px] text-stone-400 uppercase tracking-[0.3em] font-medium italic">Powered by TOTS-OS</p>
                      </footer>
                    </div>

                    <div className="flex justify-center mt-12">
                        <button 
                        onClick={() => setStep('schedule')}
                        className="bg-stone-900 px-24 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] text-[var(--brand-primary)] shadow-2xl hover:scale-105 transition-all"
                        >
                        Proceed to Scheduling
                        </button>
                    </div>
                  </div>
                )}

                {step === 'schedule' && (
                  <div className="w-full max-w-2xl mx-auto bg-white p-16 rounded-[4rem] border border-stone-200 shadow-2xl text-center mt-10 md:mt-0">
                     <Users size={32} className="mx-auto mb-6 text-stone-200" />
                     <h2 className="text-4xl font-serif italic text-stone-800 mb-8">Scheduling </h2>
                     <div className="space-y-8 text-left mb-12">
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-3 block ml-1">Target Campaign List</label>
                         <select value={form.list_id} onChange={e => setForm({...form, list_id: e.target.value})} className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:border-stone-900">
                           <option value="">Select target audience list...</option>
                           {lists?.length > 0 ? (
                             lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                           ) : (
                             <option value="" disabled>No lists available</option>
                           )}
                         </select>
                       </div>
                       <div>
                         <label className="text-[9px] font-black uppercase text-stone-400 mb-3 block ml-1">Scheduled Time</label>
                         <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({...form, scheduled_for: e.target.value})} className="w-full p-5 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:border-stone-900" />
                       </div>
                     </div>
                     <div className="flex justify-center gap-4">
                       <button onClick={() => setStep('editor')} className="px-10 py-5 rounded-2xl bg-stone-100 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all">Return to Editor</button>
                       <button 
                        onClick={() => scheduleCampaign(form)} 
                        className="px-12 py-5 rounded-2xl bg-stone-900 text-[var(--brand-primary)] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:brightness-110"
                       >
                         <CalendarIcon size={16}/>Schedule
                       </button>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL SCROLLBAR REMOVAL */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}