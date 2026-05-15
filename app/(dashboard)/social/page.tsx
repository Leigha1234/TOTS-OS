"use client";

import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, Upload, Sparkles, 
  Edit3, Hash, Clock, X, Calendar as CalIcon,
  ArrowRight, Save, BrainCircuit, TrendingUp, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface SocialPost {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string;
  media_url: string;
  scheduled_for: string; // Matches your actual Supabase column
  status: string;
  format: string;
}

export default function SocialStudio() {
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler">("lab");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [status, setStatus] = useState("Ready");
  
  // --- Post State ---
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncPosts = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase.from('socials').select('*').order('created_at', { ascending: false });
    if (!error) setPosts((data as SocialPost[]) || []);
    setStatus("Ready");
  };

  useEffect(() => { syncPosts(); }, [supabase]);

  // --- AI Engines ---
  const handleAICaption = async () => {
    setIsGenerating(true);
    // Simulating Clarity AI analysis
    await new Promise(r => setTimeout(r, 1200));
    setCaption("Efficiency isn't just about speed; it's about the clarity of your digital workspace. Experience the next level of organization with TOTs OS.");
    setIsGenerating(false);
    toast.success("Clarity AI generated a suggested post.");
  };

  const generateAIHashtags = () => {
    setHashtags("#TheOrganisedTypes #DigitalEfficiency #SaaS #Organization");
    toast.success("Hashtags generated.");
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSavePost = async () => {
    if (!caption || !scheduledTime) return toast.error("Missing Caption or Time");
    
    setStatus("Saving");
    
    // Mapping exactly to your DB: scheduled_for, status, format
    const { error } = await supabase.from('socials').insert([{
      caption,
      platform,
      hashtags,
      media_url: mediaPreview || `https://picsum.photos/seed/${Math.random()}/800/1200`,
      scheduled_for: new Date(scheduledTime).toISOString(),
      status: 'scheduled',
      format: 'Image'
    }]);

    if (!error) {
      toast.success("Post saved to schedule.");
      setCaption(""); setHashtags(""); setScheduledTime(""); setMediaPreview(null);
      setShowSaveModal(false);
      syncPosts();
    } else {
      console.error("Supabase Error:", error);
      toast.error("Save failed. Check console for column mismatches.");
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
      
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 bg-white/80 p-4 rounded-full border border-stone-100 shadow-sm backdrop-blur-xl sticky top-8 z-40">
        <div className="flex items-center gap-8 pl-4">
          <div className="w-8 h-8 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-[#a9b897]"><Layers size={16}/></div>
          <div className="flex bg-stone-100 p-1 rounded-full">
            {(["lab", "scheduler"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-[#1c1c1c] shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>{tab}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mr-1">
          <div className="px-4 py-2 rounded-full bg-stone-50 border border-stone-100 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`}/>
            <span className="text-[8px] font-black uppercase text-stone-400">{status}</span>
          </div>
          <button onClick={syncPosts} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><RefreshCcw size={14}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-12">
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Creation Space</p>
                    <h1 className="text-7xl font-serif italic text-[#1c1c1c]">The Lab.</h1>
                  </div>
                  <button 
                    onClick={handleAICaption}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#1c1c1c] hover:bg-stone-200 transition-all shadow-sm"
                  >
                    <Sparkles size={14} className={isGenerating ? "animate-spin text-[#a9b897]" : "text-[#a9b897]"}/>
                    {isGenerating ? "Analyzing..." : "Clarity AI Suggestion"}
                  </button>
                </header>

                <div className="bg-white rounded-[3.5rem] border border-stone-100 shadow-2xl p-1 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-12 space-y-8 flex flex-col justify-between">
                       <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-stone-300">Draft Caption</label>
                        <textarea 
                          value={caption} 
                          onChange={(e) => setCaption(e.target.value)} 
                          placeholder="Your narrative..."
                          className="w-full h-80 bg-transparent text-3xl font-serif italic outline-none resize-none placeholder:text-stone-100 leading-tight"
                        />
                       </div>
                       <button 
                        onClick={() => setShowSaveModal(true)}
                        className="w-full bg-[#1c1c1c] text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-stone-200"
                       >
                         Next: Schedule & Save <ArrowRight size={14} className="text-[#a9b897]"/>
                       </button>
                    </div>

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-stone-50 m-2 rounded-[3rem] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative min-h-[500px]"
                    >
                      {mediaPreview ? (
                        <img src={mediaPreview} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto text-stone-200 mb-4" size={24} />
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">Drop Visual Asset</p>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Clarity Analyst */}
              <div className="col-span-12 lg:col-span-4 pt-28 space-y-12">
                <section className="bg-[#1c1c1c] rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={80}/></div>
                  <div className="space-y-1 relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">Clarity Analyst</p>
                    <h3 className="text-2xl font-serif italic">Strategy Insight</h3>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-[#a9b897] font-black text-[8px] uppercase tracking-widest">
                        <TrendingUp size={10}/> Content Balance
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed italic">"Your feed is 80% educational. The analyst recommends adding a 'Behind the Scenes' post to increase engagement."</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-black text-[8px] uppercase tracking-widest">
                        <AlertCircle size={10}/> Optimization
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed italic">"Optimal posting window for LinkedIn detected: tomorrow at 9:00 AM."</p>
                    </div>
                  </div>
                </section>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-stone-300 tracking-widest pl-2">Scheduled Flow</h3>
                  <div className="space-y-4">
                    {posts.slice(0, 3).map(post => (
                      <div key={post.id} className="bg-white p-4 rounded-[2rem] border border-stone-100 flex items-center gap-4 shadow-sm group">
                        <div className="w-14 h-14 bg-stone-50 rounded-2xl overflow-hidden shadow-inner">
                          <img src={post.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black uppercase text-[#a9b897]">{post.platform}</p>
                          <p className="text-sm font-serif italic truncate text-stone-600 leading-none">"{post.caption}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <header className="flex justify-between items-end border-b border-stone-100 pb-12">
                  <h1 className="text-8xl font-serif italic text-[#1c1c1c] tracking-tighter leading-none">Grid.</h1>
                  <div className="flex gap-2">
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-4 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all"><ChevronLeft size={20}/></button>
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-4 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all"><ChevronRight size={20}/></button>
                  </div>
               </header>
               <div className="grid grid-cols-7 gap-6 bg-white p-16 rounded-[4rem] border border-stone-100 shadow-2xl">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] font-black text-stone-200 uppercase tracking-widest pb-8">{d}</div>)}
                  {calendar.days.map((day, i) => {
                    const hasPost = posts.some(p => {
                      const d = new Date(p.scheduled_for);
                      return d.getDate() === day.d && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    });
                    return (
                      <div key={i} className={`aspect-square rounded-[2rem] border border-stone-50 flex items-center justify-center text-4xl font-serif italic relative group ${day.current ? 'text-[#1c1c1c] hover:bg-stone-50 cursor-pointer transition-all' : 'text-stone-50 opacity-10'}`}>
                        {day.d > 0 ? day.d : ""}
                        {hasPost && <div className="absolute bottom-6 w-2 h-2 rounded-full bg-[#a9b897] shadow-[0_0_10px_#a9b897]" />}
                      </div>
                    );
                  })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- SAVE MODAL --- */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveModal(false)} className="absolute inset-0 bg-[#FBFBFA]/90 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl border border-stone-100 overflow-hidden"
            >
              <div className="p-12 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-2">Final Step</p>
                    <h2 className="text-4xl font-serif italic">Save Post.</h2>
                  </div>
                  <button onClick={() => setShowSaveModal(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={18}/></button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300">Platform</label>
                    <div className="flex gap-2">
                      {["instagram", "linkedin", "twitter"].map(p => (
                        <button key={p} onClick={() => setPlatform(p)} className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white shadow-lg' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>{p}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Clock size={12}/> Choose Time</label>
                    <input 
                      type="datetime-local" 
                      value={scheduledTime} 
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-medium outline-none focus:ring-2 ring-[#a9b897]/20"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Hash size={12}/> Hashtags</label>
                      <button onClick={generateAIHashtags} className="text-[9px] font-black uppercase text-[#a9b897] flex items-center gap-2 hover:opacity-70 transition-opacity"><Sparkles size={12}/> AI Suggest</button>
                    </div>
                    <input 
                      value={hashtags} 
                      onChange={(e) => setHashtags(e.target.value)} 
                      placeholder="#strategy #innovation"
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSavePost}
                  className="w-full bg-[#1c1c1c] text-white py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 hover:scale-[1.01] transition-all shadow-xl shadow-stone-200"
                >
                  Save to Schedule <Save size={16} fill="#a9b897" className="text-[#a9b897]"/>
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