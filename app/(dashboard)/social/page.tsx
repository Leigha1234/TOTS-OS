"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, Upload, Sparkles, 
  Edit3, Hash, Clock, Calendar as CalIcon,
  Instagram, Linkedin, Twitter, X
} from "lucide-react";
import { toast } from "sonner";

interface SocialNode {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string;
  media_url: string;
  scheduled_date: string;
  created_at: string;
}

export default function SocialStudio() {
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler">("lab");
  const [isManualMode, setIsManualMode] = useState(true);
  const [status, setStatus] = useState("Ready");
  
  // Form State
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [nodes, setNodes] = useState<SocialNode[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncNodes = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setNodes((data as SocialNode[]) || []);
      setStatus("Ready");
    }
  };

  useEffect(() => {
    syncNodes();
    const channel = supabase.channel('social_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'socials' }, syncNodes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAISynthesis = async () => {
    if (!caption && isManualMode) {
      toast.error("Enter a prompt first");
      return;
    }
    setIsGenerating(true);
    setStatus("Synthesizing");
    
    // Simulate AI Logic for Hashtags/Refinement
    await new Promise(r => setTimeout(r, 1200));
    const generatedTags = "#TheOrganisedTypes #Innovation #TechFlow #" + platform;
    setHashtags(generatedTags);
    
    setIsGenerating(false);
    setStatus("Ready");
    toast.success("AI Logic Applied");
  };

  const handleCommitToCloud = async () => {
    if (!caption || !scheduledDate) {
      toast.error("Caption and Date are required");
      return;
    }
    
    setStatus("Persisting");
    const { error } = await supabase.from('socials').insert([{
      caption,
      platform,
      hashtags,
      media_url: mediaPreview || `https://picsum.photos/seed/${Math.random()}/800/1200`,
      scheduled_date: new Date(scheduledDate).toISOString()
    }]);

    if (!error) {
      toast.success("Content Scheduled Successfully");
      setCaption("");
      setHashtags("");
      setScheduledDate("");
      setMediaPreview(null);
      syncNodes();
    } else {
      toast.error("Database error. Check console.");
      console.error(error);
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
      
      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 bg-white/80 p-5 rounded-[2.5rem] border border-stone-100 shadow-sm backdrop-blur-xl sticky top-8 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1c1c1c] rounded-2xl flex items-center justify-center text-[#a9b897]">
              <Layers size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest hidden sm:block">TOTs Studio</p>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            {(["lab", "scheduler"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-[#1c1c1c] shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>{tab}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-stone-50 border-stone-100">
             <div className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
             <span className="text-[9px] font-black uppercase text-stone-400">{status}</span>
           </div>
           <button onClick={syncNodes} className="p-2.5 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><RefreshCcw size={16} className={status === "Syncing" ? "animate-spin" : ""}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* SOCIAL LAB VIEW */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-12">
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Synthesis</p>
                    <h1 className="text-7xl font-serif italic text-[#1c1c1c]">The Lab.</h1>
                  </div>
                  <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner">
                    <button onClick={() => setIsManualMode(true)} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isManualMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Manual</button>
                    <button onClick={() => setIsManualMode(false)} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isManualMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}>AI Engine</button>
                  </div>
                </header>

                <div className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-2xl space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Layers size={14}/> Destination</label>
                      <div className="flex gap-2">
                        {["Instagram", "LinkedIn", "Twitter"].map(p => (
                          <button key={p} onClick={() => setPlatform(p)} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white border-[#1c1c1c] shadow-lg' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Clock size={14}/> Schedule Time</label>
                      <input 
                        type="datetime-local" 
                        value={scheduledDate} 
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 ring-[#a9b897]/20 transition-all"
                      />
                    </section>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Edit3 size={14}/> Caption Content</label>
                        <textarea 
                          value={caption} 
                          onChange={(e) => setCaption(e.target.value)} 
                          placeholder="Craft your message..."
                          className="w-full h-48 bg-stone-50 rounded-[2rem] p-8 text-2xl font-serif italic outline-none resize-none shadow-inner border-none focus:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Hash size={14}/> Hashtags</label>
                        <div className="relative">
                          <input 
                            value={hashtags} 
                            onChange={(e) => setHashtags(e.target.value)} 
                            placeholder="#strategy #innovation"
                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 pr-14 text-sm font-medium outline-none focus:bg-white transition-all"
                          />
                          <button onClick={handleAISynthesis} className="absolute right-4 top-4 text-[#a9b897] hover:scale-110 transition-transform"><Sparkles size={20}/></button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Upload size={14}/> Visual Asset</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full min-h-[300px] rounded-[3rem] bg-stone-50 border-2 border-dashed border-stone-100 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative"
                      >
                        {mediaPreview ? (
                          <img src={mediaPreview} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-10">
                            <Upload className="mx-auto text-stone-200 mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Drop or Click to Upload</p>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCommitToCloud}
                    disabled={!caption || !scheduledDate}
                    className="w-full bg-[#1c1c1c] text-white py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-95 disabled:opacity-30 transition-all shadow-2xl shadow-stone-400/20"
                  >
                    Commit Node to Cloud <Zap size={18} fill="#a9b897" className="text-[#a9b897]"/>
                  </button>
                </div>
              </div>

              {/* Sidebar: Upcoming List */}
              <div className="col-span-12 lg:col-span-4 pt-28 space-y-10">
                <h3 className="text-[11px] font-black uppercase text-stone-300 tracking-widest border-b border-stone-100 pb-6">Temporal Queue</h3>
                <div className="space-y-6">
                  {nodes.slice(0, 5).map(node => (
                    <div key={node.id} className="bg-white p-5 rounded-[2.5rem] border border-stone-100 flex items-center gap-5 group hover:border-[#a9b897] transition-all shadow-sm">
                      <div className="w-20 h-20 bg-stone-50 rounded-3xl overflow-hidden flex-shrink-0 shadow-inner">
                        <img src={node.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase text-[#a9b897] mb-1">{node.platform}</p>
                        <p className="text-lg font-serif italic truncate text-stone-600 leading-none">"{node.caption}"</p>
                        <p className="text-[8px] font-bold text-stone-300 uppercase mt-2">{new Date(node.scheduled_date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SCHEDULER VIEW */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <header className="flex justify-between items-end border-b border-stone-100 pb-12">
                  <h1 className="text-8xl font-serif italic text-[#1c1c1c] leading-none tracking-tighter">Grid.</h1>
                  <div className="flex gap-4">
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-5 bg-white border border-stone-100 rounded-3xl hover:shadow-xl transition-all"><ChevronLeft size={24}/></button>
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-5 bg-white border border-stone-100 rounded-3xl hover:shadow-xl transition-all"><ChevronRight size={24}/></button>
                  </div>
               </header>
               <div className="grid grid-cols-7 gap-8 bg-white p-20 rounded-[5rem] border border-stone-100 shadow-2xl">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[11px] font-black text-stone-200 uppercase tracking-widest pb-8">{d}</div>
                  ))}
                  {calendar.days.map((day, i) => {
                    const hasNode = nodes.some(n => {
                      const d = new Date(n.scheduled_date);
                      return d.getDate() === day.d && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    });
                    return (
                      <div key={i} className={`aspect-square rounded-[2.5rem] border border-stone-50 flex items-center justify-center text-5xl font-serif italic relative group ${day.current ? 'text-[#1c1c1c] hover:bg-stone-50 cursor-pointer transition-all' : 'text-stone-50 opacity-10'}`}>
                        {day.d > 0 ? day.d : ""}
                        {hasNode && (
                          <div className="absolute bottom-8 w-3 h-3 rounded-full bg-[#a9b897] shadow-[0_0_20px_#a9b897]" />
                        )}
                      </div>
                    );
                  })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}</style>
    </div>
  );
}