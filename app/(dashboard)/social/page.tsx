"use client";

import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, Upload, Sparkles, 
  Edit3, Hash, Clock, X, Calendar as CalIcon,
  ArrowRight, Save, BrainCircuit, TrendingUp, AlertCircle,
  BarChart3, Video, Image as ImageIcon, Camera, 
  Music, Wand2, MonitorPlay, Pin, Instagram, 
  Twitter, Linkedin, CheckCircle2, Copy, Send
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --- Types & Interfaces ---
interface SocialPost {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string;
  media_url: string;
  scheduled_for: string;
  status: string;
  format: string;
  ai_model?: string;
}

interface AIConfig {
  tone: string;
  goal: string;
  length: string;
}

export default function UnifiedSocialStudio() {
  // --- UI State ---
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [activeMediaTab, setActiveMediaTab] = useState<"upload" | "ai-image" | "ai-video">("upload");
  
  // --- Post State ---
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("Post");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  
  // --- AI State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiConfig, setAIConfig] = useState<AIConfig>({ tone: "Minimalist", goal: "Engagement", length: "Short" });
  const [aiAnalysis, setAiAnalysis] = useState({
    engagementScore: 88,
    bestTime: "Tomorrow, 6:00 PM",
    sentiment: "Inspirational"
  });

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Supabase Setup ---
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncPosts = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase.from('socials').select('*').order('scheduled_for', { ascending: true });
    if (!error) setPosts((data as SocialPost[]) || []);
    setStatus("Ready");
  };

  useEffect(() => { syncPosts(); }, [supabase]);

  // --- AI Logic Engines ---
  
  const generateAICaption = async () => {
    setIsGenerating(true);
    // Mimicking high-level LLM call
    await new Promise(r => setTimeout(r, 1500));
    const variations = [
      "Architecture is the silent language of efficiency. #TOTsOS #DigitalDesign",
      "Streamline the chaos. The new Social Studio is here to redefine your workflow. ✨",
      "Clarity isn't a goal; it's a standard. Experience the OS of the future."
    ];
    setCaption(variations[Math.floor(Math.random() * variations.length)]);
    setIsGenerating(false);
    toast.success("Clarity AI: Narrative Optimized");
  };

  const generateAIMedia = async (type: 'image' | 'video') => {
    if (!prompt) return toast.error("Enter a prompt for the AI");
    setIsGenerating(true);
    setStatus(`Generating ${type}...`);
    
    // Simulate DALL-E / Sora Style Generation
    await new Promise(r => setTimeout(r, 3000));
    const mockUrl = type === 'image' 
      ? `https://picsum.photos/seed/${Math.random()}/1080/1350` 
      : "https://assets.mixkit.co/videos/preview/mixkit-clouds-and-sun-light-102-large.mp4";
    
    setMediaPreview(mockUrl);
    setIsGenerating(false);
    setStatus("Ready");
    toast.success(`AI ${type} created successfully.`);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDateClick = (day: number) => {
    if (day === 0) return;
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 18, 0);
    setScheduledTime(selected.toISOString().slice(0, 16));
    setShowSaveModal(true);
  };

  const saveToSupabase = async () => {
    if (!caption || !scheduledTime) return toast.error("Please fill in post details");
    setStatus("Saving");
    
    const { error } = await supabase.from('socials').insert([{
      caption,
      platform,
      hashtags,
      media_url: mediaPreview || `https://picsum.photos/seed/${Math.random()}/800/1200`,
      scheduled_for: new Date(scheduledTime).toISOString(),
      status: 'scheduled',
      format: format
    }]);

    if (!error) {
      toast.success("Scheduled to Grid");
      resetForm();
      syncPosts();
    } else {
      toast.error("Database connection error");
    }
    setStatus("Ready");
  };

  const resetForm = () => {
    setCaption(""); setHashtags(""); setMediaPreview(null);
    setPrompt(""); setShowSaveModal(false);
  };

  // --- Calendar Logic ---
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
    <div className="min-h-screen bg-[#F6F6F3] text-[#1c1c1c] p-6 lg:p-10 font-sans antialiased selection:bg-[#a9b897]/30">
      
      {/* Navigation Header */}
      <nav className="max-w-[1600px] mx-auto flex justify-between items-center mb-12 bg-white/90 p-3 rounded-[2rem] border border-stone-200/50 shadow-sm backdrop-blur-2xl sticky top-6 z-50">
        <div className="flex items-center gap-6 pl-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1c1c1c] rounded-2xl flex items-center justify-center text-[#a9b897] shadow-lg shadow-black/10">
              <Layers size={18}/>
            </div>
            <span className="font-serif italic text-xl tracking-tighter">Social.OS</span>
          </div>
          <div className="h-6 w-px bg-stone-200 mx-2" />
          <Link href="/reports">
            <button className="flex items-center gap-2.5 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
              <BarChart3 size={14} className="text-[#a9b897]"/>
              See Reports
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3 pr-2">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 border border-stone-100">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`}/>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{status}</span>
          </div>
          <button onClick={syncPosts} className="p-3 hover:bg-stone-100 rounded-full transition-all text-stone-400 hover:text-stone-900"><RefreshCcw size={16}/></button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto space-y-12">
        
        {/* SECTION 1: Strategic Overview (Calendar + AI Insights) */}
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          
          {/* Calendar Grid */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            <div className="flex justify-between items-center px-6">
              <div className="flex items-baseline gap-4">
                <h2 className="text-6xl font-serif italic tracking-tighter">{calendar.monthName}</h2>
                <span className="text-stone-300 font-serif text-2xl">{calendar.year}</span>
              </div>
              <div className="flex bg-white rounded-2xl border border-stone-100 p-1 shadow-sm">
                 <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 hover:bg-stone-50 rounded-xl transition-all"><ChevronLeft size={20}/></button>
                 <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 hover:bg-stone-50 rounded-xl transition-all"><ChevronRight size={20}/></button>
              </div>
            </div>
            
            <div className="bg-white p-10 lg:p-14 rounded-[4rem] border border-stone-100 shadow-xl shadow-stone-200/40">
              <div className="grid grid-cols-7 gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-stone-300 uppercase tracking-[0.3em] mb-6">{d}</div>
                ))}
                {calendar.days.map((day, i) => {
                  const dayPosts = posts.filter(p => {
                    const d = new Date(p.scheduled_for);
                    return d.getDate() === day.d && d.getMonth() === currentDate.getMonth();
                  });
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleDateClick(day.d)}
                      className={`aspect-[4/3] rounded-[2rem] border border-stone-50 flex flex-col items-center justify-center relative group transition-all duration-500
                        ${day.current ? 'bg-white hover:bg-[#a9b897]/5 hover:scale-[1.02] hover:border-[#a9b897]/20 cursor-pointer' : 'opacity-10 pointer-events-none'}
                        ${dayPosts.length > 0 ? 'border-stone-200 shadow-sm' : ''}
                      `}
                    >
                      <span className={`text-2xl font-serif italic ${dayPosts.length > 0 ? 'text-[#1c1c1c]' : 'text-stone-200'}`}>{day.d > 0 ? day.d : ""}</span>
                      <div className="flex gap-1 mt-2">
                        {dayPosts.map((_, idx) => (
                          <div key={idx} className="w-1.5 h-1.5 rounded-full bg-[#a9b897]" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clarity Strategic Analyst Sidebar */}
          <div className="col-span-12 xl:col-span-4 space-y-8">
            <section className="bg-[#1c1c1c] rounded-[3.5rem] p-10 text-white min-h-[500px] flex flex-col shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                 <BrainCircuit size={300}/>
               </div>
               
               <div className="relative z-10 space-y-8 h-full flex flex-col">
                  <header className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">Clarity Analyst v4</p>
                      <h3 className="text-3xl font-serif italic">Feed Strategy</h3>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                      <Zap size={20} className="text-amber-400 fill-amber-400" />
                    </div>
                  </header>

                  <div className="space-y-6 flex-1">
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-stone-500">Projected Reach</span>
                        <span className="text-[#a9b897] font-black text-xs">+{aiAnalysis.engagementScore}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-[#a9b897]" />
                      </div>
                      <p className="text-[12px] text-stone-400 italic leading-relaxed">"Content density is high on Thursdays. Shifting your next Reel to Friday at 6pm will likely yield 20% higher initial saves."</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                         <p className="text-[8px] font-black uppercase text-stone-500 mb-2">Dominant Tone</p>
                         <p className="text-sm font-serif italic">{aiAnalysis.sentiment}</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                         <p className="text-[8px] font-black uppercase text-stone-500 mb-2">Peak Window</p>
                         <p className="text-sm font-serif italic">18:00 - 21:00</p>
                       </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <button className="w-full py-4 bg-[#a9b897] text-[#1c1c1c] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">
                      Refresh Deep Analysis
                    </button>
                  </div>
               </div>
            </section>
          </div>
        </div>

        {/* SECTION 2: The Production Lab */}
        <div className="space-y-8 pb-20">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 px-6">
            <div className="space-y-1">
              <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#a9b897]">Workspace</p>
              <h1 className="text-8xl font-serif italic tracking-tighter leading-none">The Lab.</h1>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={generateAICaption}
                disabled={isGenerating}
                className="px-8 py-4 bg-white border border-stone-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-stone-50 shadow-sm transition-all"
              >
                <Wand2 size={16} className={isGenerating ? "animate-pulse" : "text-[#a9b897]"} />
                {isGenerating ? "Synthesizing..." : "Narrative AI"}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column: Creative Input */}
            <div className="col-span-12 lg:col-span-7">
               <div className="bg-white rounded-[4rem] border border-stone-100 shadow-2xl p-2 min-h-[650px] flex flex-col">
                  <div className="flex-1 p-12 space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black uppercase text-stone-300 tracking-widest">Storytelling</label>
                        <div className="flex gap-4">
                           {['Casual', 'Elevated', 'Technical'].map(t => (
                             <button 
                                key={t} 
                                onClick={() => setAIConfig({...aiConfig, tone: t})}
                                className={`text-[9px] font-black uppercase ${aiConfig.tone === t ? 'text-[#a9b897]' : 'text-stone-300'}`}
                             >{t}</button>
                           ))}
                        </div>
                      </div>
                      <textarea 
                        value={caption} 
                        onChange={(e) => setCaption(e.target.value)} 
                        placeholder="Define the vision..."
                        className="w-full h-48 bg-transparent text-4xl font-serif italic outline-none resize-none placeholder:text-stone-100 leading-[1.1]"
                      />
                    </div>

                    <div className="space-y-6 pt-10 border-t border-stone-50">
                      <div className="flex items-center gap-6">
                        <button onClick={() => setActiveMediaTab("upload")} className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeMediaTab === 'upload' ? 'border-[#a9b897] text-[#1c1c1c]' : 'border-transparent text-stone-300'}`}>Static Asset</button>
                        <button onClick={() => setActiveMediaTab("ai-image")} className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeMediaTab === 'ai-image' ? 'border-[#a9b897] text-[#1c1c1c]' : 'border-transparent text-stone-300'}`}>Magic Canvas (AI)</button>
                        <button onClick={() => setActiveMediaTab("ai-video")} className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeMediaTab === 'ai-video' ? 'border-[#a9b897] text-[#1c1c1c]' : 'border-transparent text-stone-300'}`}>Motion Engine (AI)</button>
                      </div>

                      {activeMediaTab !== 'upload' ? (
                        <div className="space-y-4 bg-stone-50 p-6 rounded-3xl border border-stone-100">
                          <input 
                            placeholder="Describe the aesthetic (e.g., 'Hyper-minimalist 3D office space, sage green accents')..."
                            className="w-full bg-transparent border-b border-stone-200 py-3 text-sm outline-none font-medium italic"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                          />
                          <button 
                            onClick={() => generateAIMedia(activeMediaTab === 'ai-image' ? 'image' : 'video')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-[#a9b897] hover:opacity-70"
                          >
                            <Sparkles size={14}/> Trigger Generation
                          </button>
                        </div>
                      ) : (
                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-stone-100 rounded-3xl">
                           <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Asset Pipeline Offline - Upload via Sidebar</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <button 
                      onClick={() => setShowSaveModal(true)}
                      className="w-full bg-[#1c1c1c] text-white py-8 rounded-[3.5rem] font-black uppercase text-[12px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-stone-800 transition-all shadow-xl shadow-stone-200"
                    >
                      Process & Review <ArrowRight size={18} className="text-[#a9b897]"/>
                    </button>
                  </div>
               </div>
            </div>

            {/* Right Column: Visual Preview & Selection */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
               <div 
                 onClick={() => activeMediaTab === 'upload' && fileInputRef.current?.click()}
                 className={`aspect-[4/5] bg-white rounded-[4rem] border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden relative shadow-inner transition-all duration-700
                   ${activeMediaTab === 'upload' ? 'cursor-pointer hover:bg-stone-50' : 'border-solid border-stone-100 shadow-2xl'}
                 `}
               >
                 <AnimatePresence mode="wait">
                   {mediaPreview ? (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
                        {mediaPreview.includes('.mp4') ? (
                          <video src={mediaPreview} autoPlay loop muted className="w-full h-full object-cover" />
                        ) : (
                          <img src={mediaPreview} className="w-full h-full object-cover" />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setMediaPreview(null); }} className="absolute top-8 right-8 p-3 bg-black/20 backdrop-blur-xl text-white rounded-full hover:bg-black/40"><X size={20}/></button>
                     </motion.div>
                   ) : (
                     <div className="text-center space-y-4">
                       <div className="w-20 h-20 bg-stone-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-stone-300">
                         {activeMediaTab === 'ai-video' ? <Video size={32}/> : <ImageIcon size={32}/>}
                       </div>
                       <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">Preview Engine Offline</p>
                     </div>
                   )}
                 </AnimatePresence>
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
               </div>

               <div className="grid grid-cols-4 gap-4 px-4">
                  {[
                    { id: 'insta', icon: <Instagram size={16}/>, label: 'Insta' },
                    { id: 'tiktok', icon: <Video size={16}/>, label: 'TikTok' },
                    { id: 'pin', icon: <Pin size={16}/>, label: 'Pin' },
                    { id: 'link', icon: <Linkedin size={16}/>, label: 'Link' }
                  ].map(plat => (
                    <button 
                      key={plat.id}
                      onClick={() => setPlatform(plat.id)}
                      className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${platform === plat.id ? 'bg-white border-stone-200 shadow-md scale-105' : 'bg-transparent border-transparent grayscale opacity-40'}`}
                    >
                      <div className={platform === plat.id ? 'text-[#a9b897]' : 'text-[#1c1c1c]'}>{plat.icon}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest">{plat.label}</span>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- PRODUCTION MODAL (SAVE) --- */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveModal(false)} className="absolute inset-0 bg-[#FBFBFA]/90 backdrop-blur-2xl" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl border border-stone-100 overflow-hidden grid grid-cols-1 lg:grid-cols-2"
            >
              <div className="p-16 space-y-12 bg-stone-50/50">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Final Validation</p>
                  <h2 className="text-5xl font-serif italic tracking-tighter">Review & Sync.</h2>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300">Format Selection</label>
                    <div className="flex flex-wrap gap-2">
                      {["Post", "Story", "Reel", "TikTok", "Pin"].map(f => (
                        <button key={f} onClick={() => setFormat(f)} className={`px-6 py-3 rounded-2xl text-[10px] font-bold border transition-all ${format === f ? 'bg-[#1c1c1c] text-white shadow-lg' : 'bg-white text-stone-400 border-stone-100'}`}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Clock size={12}/> Production Time</label>
                    <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full bg-white border border-stone-100 rounded-3xl p-6 text-sm font-medium outline-none focus:ring-4 ring-[#a9b897]/10" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Hash size={12}/> Tag Strategy</label>
                      <button onClick={() => setHashtags("#strategy #design #minimalism #architecture")} className="text-[9px] font-black uppercase text-[#a9b897]">Suggest Tags</button>
                    </div>
                    <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="w-full bg-white border border-stone-100 rounded-3xl p-6 text-sm font-medium outline-none" />
                  </div>
                </div>

                <button onClick={saveToSupabase} className="w-full bg-[#1c1c1c] text-white py-8 rounded-3xl font-black uppercase text-[12px] tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.01] transition-all">
                  Commit to Grid <Save size={18} className="text-[#a9b897]"/>
                </button>
              </div>

              <div className="hidden lg:block relative p-12 bg-white">
                <div className="h-full w-full rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  {mediaPreview ? (
                    mediaPreview.includes('.mp4') ? <video src={mediaPreview} autoPlay loop muted className="w-full h-full object-cover" /> : <img src={mediaPreview} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-stone-100" />}
                  
                  <div className="absolute bottom-8 left-8 right-8 z-20 text-white space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">{platform} {format}</p>
                    <p className="text-2xl font-serif italic leading-tight truncate">"{caption}"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        ::-webkit-datetime-edit-fields-wrapper { padding: 0; }
        ::-webkit-calendar-picker-indicator { opacity: 0.3; cursor: pointer; }
      `}</style>
    </div>
  );
}