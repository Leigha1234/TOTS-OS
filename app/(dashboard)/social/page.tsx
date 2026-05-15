"use client";

import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, Upload, Sparkles, 
  Hash, Clock, X, Calendar as CalIcon,
  ArrowRight, Save, BrainCircuit, TrendingUp, 
  BarChart3, Video, Image as ImageIcon,
  Wand2, Pin, Instagram, Linkedin, Twitter,
  PlayCircle, FileText, Globe, CheckCircle2,
  Copy, Eye, Search, Filter, Settings, MoreHorizontal,
  Maximize2, Download, AlertCircle, Info, LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --- Advanced Types ---
interface SocialPost {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string;
  media_url: string;
  scheduled_for: string;
  status: string;
  format: string;
  ai_score?: number;
}

interface AIParameter {
  mood: string;
  lighting: string;
  angle: string;
  style: string;
}

// --- Sub-Components for Scale ---
const PlatformIcon = ({ platform, size = 16 }: { platform: string; size?: number }) => {
  switch (platform.toLowerCase()) {
    case 'instagram': return <Instagram size={size} />;
    case 'tiktok': return <Video size={size} />;
    case 'linkedin': return <Linkedin size={size} />;
    case 'pinterest': return <Pin size={size} />;
    default: return <Globe size={size} />;
  }
};

export default function SocialStudioPro() {
  // --- Core UI State ---
  const [activeTab, setActiveTab] = useState<"lab" | "planner" | "assets">("lab");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Content State ---
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("Post");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  
  // --- AI Production State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiParams, setAiParams] = useState<AIParameter>({
    mood: "Minimalist",
    lighting: "Soft Natural",
    angle: "Top-Down",
    style: "Architectural"
  });

  // --- Data State ---
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assetLibrary, setAssetLibrary] = useState<{url: string, type: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Supabase Connection ---
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncData = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .order('scheduled_for', { ascending: true });
    
    if (!error) setPosts((data as SocialPost[]) || []);
    else toast.error("Database sync failed");
    setStatus("Ready");
  };

  useEffect(() => { syncData(); }, [supabase]);

  // --- The Narrative Engine ---
  const generateNarrative = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    const hooks = [
      "Clarity is the bridge between chaos and design. Explore TOTs OS.",
      "Your workflow, refined. The new architectural standard for socials.",
      "Stop scrolling, start building. The OS for high-intent creators is here."
    ];
    setCaption(hooks[Math.floor(Math.random() * hooks.length)]);
    setIsGenerating(false);
    toast.success("AI: Contextual Narrative Injected");
  };

  const optimizeHashtags = () => {
    const tags = platform === 'tiktok' 
      ? "#fyp #tech #minimalism #organized #productivity" 
      : "#design #architecture #SaaS #workflow #aesthetic";
    setHashtags(tags);
    toast.success("Strategy: Hashtags optimized for " + platform);
  };

  // --- The Visual Engine ---
  const produceAIMedia = async (mediaType: 'Image' | 'Video') => {
    if (!aiPrompt) return toast.error("Please define a visual prompt.");
    setIsGenerating(true);
    setStatus(`Rendering ${mediaType}...`);
    
    await new Promise(r => setTimeout(r, 3000));
    const mockUrl = mediaType === 'Image' 
      ? `https://picsum.photos/seed/${Math.random()}/1080/1350` 
      : "https://www.w3schools.com/html/mov_bbb.mp4";
    
    setMediaPreview(mockUrl);
    setFormat(mediaType === 'Image' ? 'Post' : 'Reel');
    setAssetLibrary(prev => [{url: mockUrl, type: mediaType}, ...prev]);
    setIsGenerating(false);
    setStatus("Ready");
    toast.success(`AI ${mediaType} synthesized and added to library.`);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setMediaPreview(result);
        setAssetLibrary(prev => [{url: result, type: 'Manual'}, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Database Logic ---
  const commitPostToCloud = async () => {
    if (!caption || !scheduledTime) return toast.error("Missing required metadata.");
    
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
      toast.success("Post successfully integrated into the cloud.");
      resetForm();
      syncData();
      setShowSaveModal(false);
    } else {
      toast.error("Cloud rejection: Check your database schema.");
    }
    setStatus("Ready");
  };

  const resetForm = () => {
    setCaption("");
    setHashtags("");
    setMediaPreview(null);
    setAiPrompt("");
  };

  // --- Calendar Logic ---
  const calendarData = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const result = [];
    for (let i = 0; i < firstDay; i++) result.push({ d: 0, current: false });
    for (let i = 1; i <= daysInMonth; i++) result.push({ d: i, current: true });
    return { 
      days: result, 
      month: currentDate.toLocaleString('default', { month: 'long' }),
      year: y 
    };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1c1c1c] flex font-sans antialiased">
      
      {/* Sidebar Navigation */}
      <aside className={`bg-white border-r border-stone-100 flex flex-col transition-all duration-500 z-50 ${isSidebarOpen ? 'w-80' : 'w-20'}`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1c1c1c] rounded-2xl flex items-center justify-center text-[#a9b897] shadow-xl shrink-0"><Layers size={20}/></div>
          {isSidebarOpen && <span className="font-serif italic text-2xl tracking-tighter">Social.OS</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'lab', icon: Wand2, label: 'Production Lab' },
            { id: 'planner', icon: CalIcon, label: 'Strategic Planner' },
            { id: 'assets', icon: ImageIcon, label: 'Asset Library' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-stone-50 text-[#1c1c1c]' : 'text-stone-300 hover:text-stone-500'}`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-stone-50">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
            {isSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header Bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-stone-50 p-6 flex justify-between items-center z-40">
           <div className="flex items-center gap-4">
             <div className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">{status}</span>
           </div>
           
           <div className="flex items-center gap-3">
              <Link href="/reports">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1c1c1c] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all">
                  <BarChart3 size={14} className="text-[#a9b897]"/>
                  Analytics
                </button>
              </Link>
              <button onClick={syncData} className="p-3 hover:bg-stone-50 rounded-full text-stone-300 hover:text-[#1c1c1c]"><RefreshCcw size={18}/></button>
           </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-12">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: PRODUCTION LAB */}
            {activeTab === 'lab' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto space-y-12">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Studio Mode</p>
                    <h1 className="text-8xl font-serif italic tracking-tighter leading-none">The Lab.</h1>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={generateNarrative} className="px-8 py-4 bg-white border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:shadow-xl transition-all">
                      <Sparkles size={16} className="text-[#a9b897]"/> Clarity AI
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-12">
                   {/* Narrative Section */}
                   <div className="col-span-12 lg:col-span-7 space-y-8">
                     <div className="bg-white rounded-[3.5rem] border border-stone-100 shadow-2xl p-12 space-y-10 min-h-[500px] flex flex-col justify-between">
                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-stone-200 tracking-[0.4em]">Brand Narrative</label>
                         <textarea 
                           value={caption} 
                           onChange={(e) => setCaption(e.target.value)}
                           className="w-full h-64 bg-transparent text-5xl font-serif italic outline-none resize-none placeholder:text-stone-100"
                           placeholder="Speak your vision..."
                         />
                       </div>
                       <button 
                        onClick={() => setShowSaveModal(true)}
                        className="w-full bg-[#1c1c1c] text-white py-8 rounded-3xl font-black uppercase text-[12px] tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.01] transition-transform"
                       >
                         Sync to Cloud <ArrowRight size={20} className="text-[#a9b897]"/>
                       </button>
                     </div>
                     
                     <div className="bg-white rounded-[3rem] p-10 border border-stone-100 space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Strategic Parameters</h4>
                          <Settings size={14} className="text-stone-200"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {['Mood', 'Lighting', 'Angle', 'Style'].map(param => (
                             <div key={param} className="space-y-2">
                               <p className="text-[8px] font-black uppercase text-stone-400">{param}</p>
                               <select className="w-full bg-stone-50 border-none rounded-xl p-3 text-[10px] font-bold outline-none">
                                 <option>Minimalist</option>
                                 <option>Cinematic</option>
                                 <option>Elevated</option>
                               </select>
                             </div>
                           ))}
                        </div>
                     </div>
                   </div>

                   {/* Production Section */}
                   <div className="col-span-12 lg:col-span-5 space-y-8">
                     <div className="aspect-[4/5] bg-stone-100 rounded-[3.5rem] overflow-hidden relative shadow-inner group border-4 border-white">
                        {mediaPreview ? (
                           mediaPreview.includes('.mp4') ? (
                             <video src={mediaPreview} autoPlay loop muted className="w-full h-full object-cover" />
                           ) : (
                             <img src={mediaPreview} className="w-full h-full object-cover" />
                           )
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 space-y-4">
                            <ImageIcon size={40} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Asset Preview Null</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white rounded-full shadow-2xl"><Upload size={20}/></button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                     </div>

                     <div className="bg-[#1c1c1c] rounded-[3rem] p-10 text-white space-y-8">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">Visual Prompt Engine</p>
                          <input 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full bg-white/5 border-b border-white/10 py-3 outline-none text-sm font-serif italic"
                            placeholder="A serene architecture office..."
                          />
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => produceAIMedia('Image')} className="flex-1 py-4 bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Gen Image</button>
                          <button onClick={() => produceAIMedia('Video')} className="flex-1 py-4 bg-[#a9b897] text-[#1c1c1c] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Gen Video</button>
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: PLANNER */}
            {activeTab === 'planner' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                 <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-6">
                      <h2 className="text-8xl font-serif italic tracking-tighter">{calendarData.month}</h2>
                      <span className="text-stone-200 text-4xl font-serif italic">{calendarData.year}</span>
                    </div>
                    <div className="flex bg-white rounded-3xl p-2 border border-stone-100 shadow-sm">
                      <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-4 hover:bg-stone-50 rounded-2xl"><ChevronLeft/></button>
                      <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-4 hover:bg-stone-50 rounded-2xl"><ChevronRight/></button>
                    </div>
                 </div>

                 <div className="grid grid-cols-7 gap-6 bg-white p-16 rounded-[4rem] border border-stone-100 shadow-2xl">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <div key={day} className="text-center text-[10px] font-black text-stone-200 uppercase tracking-[0.3em] mb-10">{day}</div>
                    ))}
                    {calendarData.days.map((day, i) => {
                      const dayPosts = posts.filter(p => new Date(p.scheduled_for).getDate() === day.d && new Date(p.scheduled_for).getMonth() === currentDate.getMonth());
                      function handleDateClick(d: number): void {
                        throw new Error("Function not implemented.");
                      }

                      return (
                        <div 
                          key={i} 
                          onClick={() => handleDateClick(day.d)}
                          className={`aspect-[4/5] rounded-[2.5rem] border border-stone-50 p-6 flex flex-col justify-between transition-all relative group
                            ${day.current ? 'bg-white hover:bg-stone-50 hover:scale-[1.03] cursor-pointer' : 'opacity-10 pointer-events-none'}
                            ${dayPosts.length > 0 ? 'border-[#a9b897]/20 shadow-lg' : ''}
                          `}
                        >
                          <span className={`text-4xl font-serif italic ${dayPosts.length > 0 ? 'text-[#1c1c1c]' : 'text-stone-100'}`}>{day.d > 0 ? day.d : ""}</span>
                          
                          <div className="space-y-2">
                             {dayPosts.map(p => (
                               <div key={p.id} className="w-full h-1.5 rounded-full bg-[#a9b897]" />
                             ))}
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </motion.div>
            )}

            {/* TAB 3: ASSETS */}
            {activeTab === 'assets' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                 <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Asset Management</p>
                    <h2 className="text-7xl font-serif italic">Archive.</h2>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-white rounded-[2.5rem] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-200 hover:text-[#a9b897] hover:border-[#a9b897] transition-all cursor-pointer"
                    >
                      <Upload size={30}/>
                      <p className="mt-4 text-[9px] font-black uppercase tracking-widest">New Asset</p>
                    </div>
                    {assetLibrary.map((asset, i) => (
                      <div key={i} className="aspect-square bg-white rounded-[2.5rem] border border-stone-50 overflow-hidden relative group shadow-sm">
                        {asset.type === 'Video' ? <video src={asset.url} className="w-full h-full object-cover" /> : <img src={asset.url} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <button onClick={() => setMediaPreview(asset.url)} className="p-3 bg-white rounded-full"><Eye size={16}/></button>
                           <button className="p-3 bg-white rounded-full text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* --- SAVE & SCHEDULE MODAL --- */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveModal(false)} className="absolute inset-0 bg-stone-100/80 backdrop-blur-3xl" />
            
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-2xl border border-stone-100 overflow-hidden grid grid-cols-12">
              <div className="col-span-12 lg:col-span-7 p-16 space-y-12 bg-stone-50/30">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Final Review</p>
                  <h2 className="text-6xl font-serif italic tracking-tighter">Sync Configuration.</h2>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Target Platform</label>
                    <div className="grid grid-cols-4 gap-4">
                       {['instagram', 'tiktok', 'linkedin', 'pinterest'].map(p => (
                         <button key={p} onClick={() => setPlatform(p)} className={`py-6 rounded-3xl flex flex-col items-center gap-3 border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white shadow-xl' : 'bg-white text-stone-300 border-stone-100'}`}>
                           <PlatformIcon platform={p} size={20} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{p}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Clock size={12}/> Schedule</label>
                      <input 
                        type="datetime-local" 
                        value={scheduledTime} 
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-white border border-stone-100 rounded-3xl p-6 text-sm font-medium outline-none shadow-inner" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><FileText size={12}/> Format</label>
                      <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full bg-white border border-stone-100 rounded-3xl p-6 text-sm font-medium outline-none shadow-inner">
                        <option>Post</option>
                        <option>Story</option>
                        <option>Reel</option>
                        <option>TikTok</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Hash size={12}/> SEO Tags</label>
                      <button onClick={optimizeHashtags} className="text-[9px] font-black uppercase text-[#a9b897]">Optimize for {platform}</button>
                    </div>
                    <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="w-full bg-white border border-stone-100 rounded-3xl p-6 text-sm font-medium outline-none" />
                  </div>
                </div>

                <button onClick={commitPostToCloud} className="w-full bg-[#1c1c1c] text-white py-10 rounded-[2.5rem] font-black uppercase text-[14px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-2xl">
                  Sync to Network <CheckCircle2 size={24} className="text-[#a9b897]"/>
                </button>
              </div>

              <div className="hidden lg:block col-span-5 relative bg-white border-l border-stone-50 p-16">
                 <div className="h-full w-full rounded-[3rem] border border-stone-100 overflow-hidden relative shadow-2xl bg-stone-50">
                   {mediaPreview ? (
                      mediaPreview.includes('.mp4') ? <video src={mediaPreview} autoPlay loop muted className="w-full h-full object-cover" /> : <img src={mediaPreview} className="w-full h-full object-cover" />
                   ) : <div className="w-full h-full flex items-center justify-center text-stone-200 font-serif italic text-2xl">No Visuals</div>}
                   
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"><PlatformIcon platform={platform} size={14}/></div>
                        <span className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">{platform} Preview</span>
                      </div>
                      <p className="text-white text-2xl font-serif italic leading-tight truncate">"{caption}"</p>
                      <p className="text-white/40 text-[10px] font-mono">{hashtags}</p>
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
        ::-webkit-datetime-edit-fields-wrapper { padding: 0.5rem; }
        ::-webkit-calendar-picker-indicator { opacity: 0.2; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}