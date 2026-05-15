"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, Upload, Sparkles, 
  Edit3, Hash, Clock, X, Calendar as CalIcon,
  CheckCircle2, Globe, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface SocialNode {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string;
  media_url: string;
  scheduled_date: string;
}

export default function SocialStudio() {
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler">("lab");
  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [status, setStatus] = useState("Ready");
  
  // --- Core State ---
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  
  const [nodes, setNodes] = useState<SocialNode[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncNodes = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase.from('socials').select('*').order('created_at', { ascending: false });
    if (!error) setNodes((data as SocialNode[]) || []);
    setStatus("Ready");
  };

  useEffect(() => { syncNodes(); }, [supabase]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateAIHashtags = () => {
    setHashtags("#TheOrganisedTypes #Innovation #DigitalStrategy #Efficiency");
    toast.success("AI Hashtags Synthesized");
  };

  const handleCommitToCloud = async () => {
    if (!caption || !scheduledDate) return toast.error("Missing Caption or Date");
    
    setStatus("Persisting");
    const { error } = await supabase.from('socials').insert([{
      caption,
      platform,
      hashtags,
      media_url: mediaPreview || `https://picsum.photos/seed/${Math.random()}/800/1200`,
      scheduled_date: new Date(scheduledDate).toISOString()
    }]);

    if (!error) {
      toast.success("Social Node Successfully Scheduled");
      setCaption(""); setHashtags(""); setScheduledDate(""); setMediaPreview(null);
      setShowSynthesisModal(false);
      syncNodes();
    } else {
      toast.error("Database Connection Failure");
    }
    setStatus("Ready");
  };

  const calendar = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ d: 0, current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ d: i, current: true });
    return { days, monthName: currentDate.toLocaleString('default', { month: 'long' }), year: y };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1c1c1c] p-8 font-sans antialiased">
      
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 bg-white/80 p-4 rounded-full border border-stone-100 shadow-sm backdrop-blur-xl sticky top-8 z-40">
        <div className="flex items-center gap-8 pl-4">
          <div className="w-8 h-8 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-[#a9b897]"><Layers size={16}/></div>
          <div className="flex bg-stone-100 p-1 rounded-full">
            {(["lab", "scheduler"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-[#1c1c1c] shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>{tab}</button>
            ))}
          </div>
        </div>
        <button onClick={syncNodes} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors mr-1"><RefreshCcw size={14}/></button>
      </nav>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-12">
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <header className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Studio Engine</p>
                  <h1 className="text-7xl font-serif italic text-[#1c1c1c]">The Lab.</h1>
                </header>

                <div className="bg-white rounded-[3.5rem] border border-stone-100 shadow-2xl p-1 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left: Input */}
                    <div className="p-12 space-y-8">
                       <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-stone-300">Composition</label>
                        <textarea 
                          value={caption} 
                          onChange={(e) => setCaption(e.target.value)} 
                          placeholder="Draft your story..."
                          className="w-full h-72 bg-transparent text-3xl font-serif italic outline-none resize-none placeholder:text-stone-100"
                        />
                       </div>
                       <button 
                        onClick={() => setShowSynthesisModal(true)}
                        className="w-full bg-[#1c1c1c] text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                       >
                         Next Step: Synthesis <ArrowRight size={14} className="text-[#a9b897]"/>
                       </button>
                    </div>

                    {/* Right: Media Drop */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-stone-50 m-2 rounded-[3rem] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative min-h-[500px]"
                    >
                      {mediaPreview ? (
                        <img src={mediaPreview} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center group">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="text-stone-300" size={20} />
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">Import Visuals</p>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Nodes */}
              <div className="col-span-12 lg:col-span-4 pt-28 space-y-10">
                <h3 className="text-[10px] font-black uppercase text-stone-300 tracking-widest pl-2">Deployment History</h3>
                <div className="space-y-4">
                  {nodes.slice(0, 4).map(node => (
                    <div key={node.id} className="bg-white p-4 rounded-[2rem] border border-stone-100 flex items-center gap-4 group shadow-sm">
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl overflow-hidden shadow-inner"><img src={node.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black uppercase text-[#a9b897]">{node.platform}</p>
                        <p className="text-sm font-serif italic truncate text-stone-600">"{node.caption}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Scheduler View */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <header className="flex justify-between items-end border-b border-stone-100 pb-12">
                  <h1 className="text-8xl font-serif italic text-[#1c1c1c] tracking-tighter">Grid.</h1>
                  <div className="flex gap-2">
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-4 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all"><ChevronLeft size={20}/></button>
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-4 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all"><ChevronRight size={20}/></button>
                  </div>
               </header>
               <div className="grid grid-cols-7 gap-6 bg-white p-16 rounded-[4rem] border border-stone-100 shadow-2xl">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] font-black text-stone-200 uppercase tracking-widest pb-8">{d}</div>)}
                  {calendar.days.map((day, i) => {
                    const hasNode = nodes.some(n => {
                      const d = new Date(n.scheduled_date);
                      return d.getDate() === day.d && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    });
                    return (
                      <div key={i} className={`aspect-square rounded-[2rem] border border-stone-50 flex items-center justify-center text-4xl font-serif italic relative group ${day.current ? 'text-[#1c1c1c] hover:bg-stone-50 cursor-pointer transition-all' : 'text-stone-50 opacity-10'}`}>
                        {day.d > 0 ? day.d : ""}
                        {hasNode && <div className="absolute bottom-6 w-2 h-2 rounded-full bg-[#a9b897] shadow-[0_0_10px_#a9b897]" />}
                      </div>
                    );
                  })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- SYNTHESIS MODAL --- */}
      <AnimatePresence>
        {showSynthesisModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSynthesisModal(false)} className="absolute inset-0 bg-[#FBFBFA]/90 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl border border-stone-100 overflow-hidden"
            >
              <div className="p-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2">Social Synthesis</p>
                    <h2 className="text-4xl font-serif italic">Finalize Node.</h2>
                  </div>
                  <button onClick={() => setShowSynthesisModal(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={18}/></button>
                </div>

                <div className="space-y-8">
                  {/* Platform Toggle */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300">Target Channel</label>
                    <div className="flex gap-2">
                      {["Instagram", "LinkedIn", "Twitter"].map(p => (
                        <button key={p} onClick={() => setPlatform(p)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>{p}</button>
                      ))}
                    </div>
                  </div>

                  {/* Date/Time Selector */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Clock size={12}/> Temporal Mapping</label>
                    <input 
                      type="datetime-local" 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-medium outline-none focus:ring-2 ring-[#a9b897]/20"
                    />
                  </div>

                  {/* Hashtag Field */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Hash size={12}/> Meta Tags</label>
                      <button onClick={generateAIHashtags} className="text-[9px] font-black uppercase text-[#a9b897] flex items-center gap-2 hover:opacity-70 transition-opacity"><Sparkles size={12}/> AI Generate</button>
                    </div>
                    <input 
                      value={hashtags} 
                      onChange={(e) => setHashtags(e.target.value)} 
                      placeholder="#growth #tots"
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCommitToCloud}
                  className="w-full bg-[#1c1c1c] text-white py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-xl shadow-stone-200"
                >
                  Commit to Cloud <Zap size={16} fill="#a9b897" className="text-[#a9b897]"/>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}</style>
    </div>
  );
}