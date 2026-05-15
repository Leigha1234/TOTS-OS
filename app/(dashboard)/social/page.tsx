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
  Maximize2, Download, AlertCircle, Info, LucideIcon,
  LayoutGrid, MonitorPlay, MousePointer2, Cpu,
  Command, Moon, Sun, Sliders
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --- Advanced System Types ---
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

interface AIStudioConfig {
  fidelity: "Standard" | "High" | "Ultra";
  aspectRatio: "9:16" | "1:1" | "4:5";
  engine: "Flux.1" | "Stable Video" | "Clarity-Gen";
}

// --- Platform Branding Logic ---
const PlatformData = {
  instagram: { color: "#E4405F", label: "Instagram", formats: ["Post", "Story", "Reel"] },
  tiktok: { color: "#000000", label: "TikTok", formats: ["Video", "Story"] },
  linkedin: { color: "#0077B5", label: "LinkedIn", formats: ["Post", "Article"] },
  pinterest: { color: "#BD081C", label: "Pinterest", formats: ["Pin", "Idea Pin"] }
};

export default function ImmersionSocialStudio() {
  // --- Global State ---
  const [viewMode, setViewMode] = useState<"canvas" | "schedule">("canvas");
  const [status, setStatus] = useState("System Ready");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Production State ---
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState<keyof typeof PlatformData>("instagram");
  const [format, setFormat] = useState("Post");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [assetShelf, setAssetShelf] = useState<{url: string; type: string}[]>([]);
  
  // --- AI Logic State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [studioConfig, setStudioConfig] = useState<AIStudioConfig>({
    fidelity: "High",
    aspectRatio: "4:5",
    engine: "Flux.1"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Supabase Instance ---
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const fetchData = async () => {
    setStatus("Syncing...");
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .order('scheduled_for', { ascending: true });
    
    if (!error) setPosts((data as SocialPost[]) || []);
    else toast.error("Database Connection Interrupted");
    setStatus("System Ready");
  };

  useEffect(() => { fetchData(); }, [supabase]);

  // --- Production Logic ---
  const runAICopywriter = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    const hooks = [
      "Digital clarity in a world of noise. Building with TOTs OS.",
      "The architecture of efficiency. Discover a new workflow standard.",
      "Less management, more creation. Your brand, synchronized."
    ];
    setCaption(hooks[Math.floor(Math.random() * hooks.length)]);
    setIsProcessing(false);
    toast.success("AI Synthesis Complete");
  };

  const runAIVisualizer = async (type: 'Image' | 'Video') => {
    if (!aiPrompt) return toast.error("Input prompt required for visual synthesis.");
    setIsProcessing(true);
    setStatus(`Rendering ${type}...`);
    
    await new Promise(r => setTimeout(r, 2800));
    const mockUrl = type === 'Image' 
      ? `https://picsum.photos/seed/${Math.random()}/1080/1350` 
      : "https://www.w3schools.com/html/mov_bbb.mp4";
    
    setMediaPreview(mockUrl);
    setAssetShelf(prev => [{url: mockUrl, type}, ...prev]);
    setIsProcessing(false);
    setStatus("System Ready");
    toast.success(`${type} integrated into canvas.`);
  };

  const handleManualUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setMediaPreview(url);
        setAssetShelf(prev => [{url, type: 'Manual'}, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  const commitToCloud = async () => {
    if (!caption || !scheduledTime) return toast.error("Metadata incomplete. Please check caption and schedule.");
    
    setStatus("Uploading...");
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
      toast.success("Node successfully committed to production.");
      setCaption(""); setHashtags(""); setMediaPreview(null);
      fetchData();
    } else {
      toast.error("Deployment failed: Schema mismatch.");
    }
    setStatus("System Ready");
  };

  // --- UI Helpers ---
  const calendar = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ d: 0, current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ d: i, current: true });
    return { days, month: currentDate.toLocaleString('default', { month: 'long' }), year: y };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#F6F6F3] text-[#1c1c1c] font-sans antialiased flex flex-col">
      
      {/* 1. TOP GLOBAL NAVIGATION */}
      <nav className="h-20 bg-white border-b border-stone-100 px-8 flex items-center justify-between sticky top-0 z-[100] backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-[#a9b897] shadow-lg"><Layers size={18}/></div>
             <span className="font-serif italic text-xl tracking-tighter">Social.OS</span>
          </div>
          <div className="h-8 w-px bg-stone-100" />
          <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-100">
             <button onClick={() => setViewMode('canvas')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'canvas' ? 'bg-white shadow-sm text-[#1c1c1c]' : 'text-stone-300'}`}>Studio Canvas</button>
             <button onClick={() => setViewMode('schedule')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'schedule' ? 'bg-white shadow-sm text-[#1c1c1c]' : 'text-stone-300'}`}>Grid Planner</button>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full border border-stone-100 bg-stone-50">
             <div className={`w-1.5 h-1.5 rounded-full ${status.includes('Ready') ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
             <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{status}</span>
           </div>
           <Link href="/reports">
             <button className="p-3 hover:bg-stone-50 rounded-full text-stone-300 hover:text-[#1c1c1c] transition-all"><BarChart3 size={20}/></button>
           </Link>
           <button onClick={fetchData} className="p-3 hover:bg-stone-50 rounded-full text-stone-300 hover:text-[#1c1c1c] transition-all"><RefreshCcw size={20}/></button>
           <div className="w-10 h-10 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Leigha" alt="User" />
           </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden flex flex-col">
        
        <AnimatePresence mode="wait">
          {viewMode === 'canvas' ? (
            <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex overflow-hidden">
              
              {/* LEFT COLUMN: Production Controls */}
              <div className="w-[450px] border-r border-stone-100 bg-white overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <header className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Core Systems</p>
                  <h2 className="text-4xl font-serif italic">Production.</h2>
                </header>

                {/* Narrative Panel */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-stone-300">Narrative Draft</label>
                    <button onClick={runAICopywriter} className="text-[10px] font-black uppercase text-[#a9b897] flex items-center gap-2 hover:opacity-70"><Sparkles size={12}/> AI Script</button>
                  </div>
                  <textarea 
                    value={caption} 
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full h-48 bg-stone-50 rounded-[2rem] p-8 text-lg font-serif italic outline-none resize-none border border-transparent focus:border-stone-100 transition-all shadow-inner"
                    placeholder="Describe the moment..."
                  />
                </div>

                {/* Platform Configuration */}
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-stone-300">Target Network</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(PlatformData).map((p) => (
                      <button 
                        key={p} 
                        onClick={() => setPlatform(p as any)}
                        className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white border-transparent' : 'bg-white border-stone-100 text-stone-400 hover:border-stone-200'}`}
                      >
                         <div className={platform === p ? 'text-[#a9b897]' : 'text-stone-300'}>
                           {p === 'instagram' && <Instagram size={16}/>}
                           {p === 'tiktok' && <Video size={16}/>}
                           {p === 'linkedin' && <Linkedin size={16}/>}
                           {p === 'pinterest' && <Pin size={16}/>}
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-widest">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule System */}
                <div className="space-y-6 pt-6 border-t border-stone-50">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Clock size={12}/> Release Timestamp</label>
                    <input 
                      type="datetime-local" 
                      value={scheduledTime} 
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-bold outline-none focus:ring-4 ring-[#a9b897]/5 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-300 flex items-center gap-2"><Hash size={12}/> Tag Strategy</label>
                    <input 
                      value={hashtags} 
                      onChange={(e) => setHashtags(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-bold outline-none"
                      placeholder="#strategy #minimalism"
                    />
                  </div>
                </div>

                <button 
                  onClick={commitToCloud}
                  className="w-full bg-[#a9b897] text-[#1c1c1c] py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-xl shadow-[#a9b897]/10"
                >
                  Deploy Node <ArrowRight size={18}/>
                </button>
              </div>

              {/* CENTER COLUMN: Live Immersive Canvas */}
              <div className="flex-1 bg-[#FBFBFA] p-12 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Visual Backdrop */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="h-full w-full bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:40px_40px]" />
                </div>

                <div className="w-full max-w-2xl aspect-[4/5] bg-white rounded-[4rem] shadow-2xl shadow-stone-200 border border-stone-100 overflow-hidden relative group">
                   <AnimatePresence mode="wait">
                     {mediaPreview ? (
                       <motion.div key={mediaPreview} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
                         {mediaPreview.includes('.mp4') ? (
                           <video src={mediaPreview} autoPlay loop muted className="w-full h-full object-cover" />
                         ) : (
                           <img src={mediaPreview} className="w-full h-full object-cover" />
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-12 flex flex-col justify-end">
                            <p className="text-white text-3xl font-serif italic leading-tight">"{caption || "Preview Narrative"}"</p>
                            <p className="text-[#a9b897] text-[10px] font-black uppercase mt-4 tracking-widest">{platform} {format}</p>
                         </div>
                       </motion.div>
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-stone-100 space-y-6">
                         <div className="w-24 h-24 bg-stone-50 rounded-[2.5rem] flex items-center justify-center">
                           <ImageIcon size={40} />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-200">Asset Canvas Null</p>
                       </div>
                     )}
                   </AnimatePresence>
                   
                   {/* Format Toggle Overlays */}
                   <div className="absolute top-8 left-8 flex gap-2">
                     {['Post', 'Story', 'Reel'].map(f => (
                       <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${format === f ? 'bg-[#1c1c1c] text-white border-transparent' : 'bg-white/80 backdrop-blur-md text-stone-400 border-stone-100 hover:bg-white'}`}>{f}</button>
                     ))}
                   </div>
                </div>

                {/* BOTTOM FLOATING SHELF: Asset History */}
                <div className="absolute bottom-10 left-10 right-10 h-32 bg-white/50 backdrop-blur-2xl rounded-[3rem] border border-white p-4 flex items-center gap-4 shadow-2xl">
                   <button onClick={() => fileInputRef.current?.click()} className="h-full aspect-square bg-white rounded-[2rem] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 hover:text-[#a9b897] hover:border-[#a9b897] transition-all">
                     <Upload size={20}/>
                     <span className="text-[8px] font-black uppercase mt-2">Upload</span>
                   </button>
                   <input type="file" ref={fileInputRef} onChange={handleManualUpload} className="hidden" />
                   <div className="h-10 w-px bg-stone-200/50 mx-2" />
                   <div className="flex-1 flex gap-4 overflow-x-auto custom-scrollbar-hide h-full items-center">
                      {assetShelf.map((asset, i) => (
                        <div key={i} onClick={() => setMediaPreview(asset.url)} className="h-full aspect-square bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer hover:scale-105 transition-all shadow-sm">
                          <img src={asset.url} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {assetShelf.length === 0 && <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest ml-4">No recent assets generated</p>}
                   </div>
                </div>
              </div>

              {/* RIGHT COLUMN: AI Synthesis & Strategy */}
              <div className="w-[400px] border-l border-stone-100 bg-white p-10 flex flex-col space-y-12">
                 <div className="space-y-8">
                    <header className="flex justify-between items-center">
                       <h3 className="text-2xl font-serif italic">AI Studio.</h3>
                       <div className="p-2 bg-stone-50 rounded-xl"><Wand2 size={16} className="text-[#a9b897]"/></div>
                    </header>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-stone-300">Prompt Engineering</label>
                        <input 
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Cyber-minimalist workspace..."
                          className="w-full bg-stone-50 border-b border-stone-100 py-3 outline-none text-sm font-serif italic"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => runAIVisualizer('Image')} className="py-4 bg-[#1c1c1c] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800">Gen Image</button>
                         <button onClick={() => runAIVisualizer('Video')} className="py-4 bg-[#a9b897] text-[#1c1c1c] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:opacity-90">Gen Video</button>
                      </div>
                    </div>
                 </div>

                 {/* Strategy Analyst Card */}
                 <section className="bg-[#1c1c1c] rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BrainCircuit size={100}/></div>
                   <div className="space-y-1 relative z-10">
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Clarity Analyst</p>
                     <h4 className="text-xl font-serif italic">Channel Health</h4>
                   </div>
                   <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-500">
                        <span>Engagement Projection</span>
                        <span className="text-[#a9b897]">84%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[84%] bg-[#a9b897]" />
                      </div>
                      <p className="text-[11px] text-stone-400 italic leading-relaxed">"Based on current trends, a **{platform} Reel** with minimalist architecture will outperform static posts by 1.4x."</p>
                   </div>
                 </section>

                 <div className="flex-1 flex flex-col justify-end">
                    <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100">
                       <div className="flex items-center gap-3 mb-4">
                         <Info size={14} className="text-[#a9b897]"/>
                         <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">System Logs</span>
                       </div>
                       <p className="text-[10px] font-medium text-stone-400 leading-relaxed italic">Cloud node 091-88 connected. Ready for deployment to production grid.</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            /* SCHEDULE MODE: Full Screen Grid */
            <motion.div key="schedule" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 p-12 overflow-y-auto custom-scrollbar">
              <div className="max-w-7xl mx-auto space-y-12">
                 <div className="flex justify-between items-end">
                   <div className="flex items-baseline gap-6">
                      <h2 className="text-8xl font-serif italic tracking-tighter">{calendar.month}.</h2>
                      <span className="text-stone-300 text-4xl font-serif italic">{calendar.year}</span>
                   </div>
                   <div className="flex bg-white rounded-[2rem] p-2 border border-stone-100 shadow-sm">
                      <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-4 hover:bg-stone-50 rounded-xl transition-all"><ChevronLeft/></button>
                      <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-4 hover:bg-stone-50 rounded-xl transition-all"><ChevronRight/></button>
                   </div>
                 </div>

                 <div className="grid grid-cols-7 gap-6 bg-white p-16 rounded-[4rem] border border-stone-100 shadow-2xl">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                      <div key={d} className="text-center text-[10px] font-black text-stone-200 uppercase tracking-widest mb-10">{d}</div>
                    ))}
                    {calendar.days.map((day, i) => {
                      const dayPosts = posts.filter(p => new Date(p.scheduled_for).getDate() === day.d && new Date(p.scheduled_for).getMonth() === currentDate.getMonth());
                      return (
                        <div 
                          key={i} 
                          className={`aspect-[4/5] rounded-[2.5rem] border border-stone-50 p-6 flex flex-col justify-between transition-all group
                            ${day.current ? 'bg-white hover:bg-stone-50 hover:scale-[1.02] cursor-pointer' : 'opacity-5 pointer-events-none'}
                            ${dayPosts.length > 0 ? 'border-[#a9b897]/30 shadow-xl shadow-[#a9b897]/5' : ''}
                          `}
                        >
                          <span className={`text-4xl font-serif italic ${dayPosts.length > 0 ? 'text-[#1c1c1c]' : 'text-stone-100'}`}>{day.d > 0 ? day.d : ""}</span>
                          <div className="flex flex-wrap gap-1 mt-4">
                             {dayPosts.map((p, idx) => (
                               <div key={p.id} className="w-full h-2 rounded-full bg-[#a9b897] shadow-[0_0_10px_#a9b89744]" />
                             ))}
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* CUSTOM STYLE INJECTIONS */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          opacity: 0.1;
          cursor: pointer;
          filter: invert(0);
        }
      `}</style>
    </div>
  );
}