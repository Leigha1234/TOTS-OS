"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Sparkles, ChevronLeft, ChevronRight, 
  Activity, Heart, Zap, Radio, Share2, ArrowUpRight, 
  Upload, Download, Globe, Calendar as CalendarIcon, 
  Eye, Clock, MoreHorizontal, Settings, User, Layers,
  Filter, Search, Plus, BarChart3, Camera, Play, 
  Target, Fingerprint, Cpu, Info, CheckCircle2,
  Instagram, Linkedin, Twitter, MessageSquare, Video,
  Terminal, ShieldCheck, Database, ZapOff, RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- System Configuration & Types ---
type Platform = "Instagram" | "LinkedIn" | "Twitter" | "Threads" | "TikTok";
type PostFormat = "Image" | "Video" | "Carousel";
type PostType = "Promotional" | "Comedic" | "Educational" | "Behind the Scenes" | "Lifestyle";
type StudioStatus = "Ready" | "Syncing" | "Synthesizing" | "Error";

interface DraftPost {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  status: "Draft" | "Scheduled" | "Published";
  scheduled_date: string;
  tags: string[];
  format: PostFormat;
  type: PostType;
  metrics?: {
    likes: number;
    shares: number;
    reach: number;
  };
}

interface StudioStats {
  reach: string;
  engagement: string;
  growth: string;
  health: number;
}

const PLATFORMS: Platform[] = ["Instagram", "LinkedIn", "Twitter", "Threads", "TikTok"];
const FORMATS: PostFormat[] = ["Image", "Video", "Carousel"];
const TYPES: PostType[] = ["Promotional", "Comedic", "Educational", "Behind the Scenes", "Lifestyle"];

export default function SocialStudioPro() {
  // --- State Engine ---
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler" | "gallery" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [studioStatus, setStudioStatus] = useState<StudioStatus>("Ready");
  const [prompt, setPrompt] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>("Image");
  const [selectedType, setSelectedType] = useState<PostType>("Promotional");
  
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<StudioStats>({
    reach: "48.2k",
    engagement: "6.4%",
    growth: "+1,240",
    health: 98
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Data Lifecycle & Sync ---
  useEffect(() => {
    setIsMounted(true);
    syncDatabase();

    const channel = supabase.channel('social_studio_v4')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log("Realtime Sync Payload:", payload);
        syncDatabase();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const syncDatabase = async () => {
    setStudioStatus("Syncing");
    const { data: posts, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    
    if (error) {
      toast.error("Cloud synchronization failed");
      setStudioStatus("Error");
      return;
    }

    if (posts) {
      const mapped: DraftPost[] = posts.map(p => ({
        id: p.id,
        platform: "LinkedIn",
        caption: p.title || "Social Node Sync",
        media_url: `https://picsum.photos/seed/${p.id}/800/1000`,
        status: "Published",
        scheduled_date: new Date().toISOString(),
        tags: ["System-Sync"],
        format: "Image",
        type: "Lifestyle",
        metrics: { likes: 124, shares: 12, reach: 1400 }
      }));
      setDrafts(mapped);
      setStudioStatus("Ready");
    }
  };

  // --- Logic Controllers ---
  const handleSynthesize = async () => {
    if (!prompt || studioStatus === "Synthesizing") return;
    
    setStudioStatus("Synthesizing");
    toast.promise(new Promise(r => setTimeout(r, 1800)), {
      loading: 'Engaging Neural Engine...',
      success: 'Content node synthesized',
      error: 'Synthesis failure'
    });

    try {
      const newNode: DraftPost = {
        id: `node-${Date.now()}`,
        platform: selectedPlatform,
        caption: prompt,
        media_url: `https://picsum.photos/seed/${Math.random()}/800/1000`,
        status: "Draft",
        scheduled_date: new Date().toISOString(),
        tags: [selectedType, "AI-V4"],
        format: selectedFormat,
        type: selectedType
      };

      setDrafts(prev => [newNode, ...prev]);
      setPrompt("");
    } finally {
      setStudioStatus("Ready");
    }
  };

  const exportAuditReport = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: "#FBFBFA",
      useCORS: true
    });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Studio-Audit-${Date.now()}.pdf`);
    toast.success("Audit Report Exported");
  };

  // --- Calendar Math ---
  const cal = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    return {
      firstDay: new Date(y, m, 1).getDay(),
      days: new Date(y, m + 1, 0).getDate(),
      monthName: currentDate.toLocaleString('default', { month: 'long' })
    };
  }, [currentDate]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 antialiased selection:bg-[#a9b897]">
      
      {/* --- REFINED NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-stone-100 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-[#a9b897] group-hover:scale-105 transition-transform">
              <Terminal size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">Studio Pro</span>
              <span className="text-[7px] font-bold text-stone-300 uppercase tracking-widest mt-1">v4.0_Stable</span>
            </div>
          </div>
          
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/50">
            {["lab", "scheduler", "gallery", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-500 ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-stone-50 border border-stone-100 rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full ${studioStatus === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Node Status: {studioStatus}</span>
          </div>
          <div className="h-6 w-px bg-stone-100" />
          <div className="flex gap-2">
            <button className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><Settings size={16}/></button>
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-[#a9b897] border border-stone-800">
              <User size={14} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          
          {/* --- VIEW: LAB --- */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-10">
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Neural Synthesis</p>
                    <h1 className="text-5xl font-serif italic text-stone-900 leading-none">Creative Lab</h1>
                  </div>
                  <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
                    <button onClick={() => setIsManualMode(false)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${!isManualMode ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}>AI Sync</button>
                    <button onClick={() => setIsManualMode(true)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isManualMode ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}>Manual</button>
                  </div>
                </header>

                <div className="bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-3">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 ml-1">Target Context</label>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map(p => (
                          <button key={p} onClick={() => setSelectedPlatform(p)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${selectedPlatform === p ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-3">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 ml-1">Asset Logic</label>
                      <div className="flex flex-wrap gap-2">
                        {FORMATS.map(f => (
                          <button key={f} onClick={() => setSelectedFormat(f)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${selectedFormat === f ? 'bg-[#a9b897] text-white border-[#a9b897]' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{f}</button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isManualMode ? "Write your direct caption..." : "Describe the creative vision for the AI engine..."}
                      className="w-full h-44 bg-stone-50 rounded-2xl p-6 text-xl font-serif italic outline-none text-stone-800 placeholder-stone-200 border border-transparent focus:border-stone-100 transition-all resize-none"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white border border-stone-100 rounded-xl text-stone-300 hover:text-[#a9b897] transition-all">
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={handleSynthesize}
                        disabled={!prompt || studioStatus === "Synthesizing"}
                        className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl disabled:opacity-20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                      >
                        {studioStatus === "Synthesizing" ? "Processing..." : "Generate Node"}
                        <Zap size={12} fill="currentColor" className="text-[#a9b897]" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-300">Pending Incubation</h3>
                    <div className="h-px flex-1 bg-stone-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {drafts.slice(0, 4).map((draft) => (
                      <div key={draft.id} className="bg-white rounded-[1.5rem] p-3 border border-stone-100 shadow-sm group">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-50 mb-4 relative">
                          <img src={draft.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-md text-[7px] font-black uppercase">{draft.platform}</div>
                        </div>
                        <p className="text-sm font-serif italic text-stone-600 line-clamp-1 px-1">"{draft.caption}"</p>
                        <div className="mt-3 flex gap-1">
                           <button className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Map to Grid</button>
                           <button className="p-2 bg-stone-50 text-stone-300 rounded-lg hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* --- SIDEBAR: System Status --- */}
              <aside className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                  <Fingerprint size={160} className="absolute -right-10 -top-10 opacity-5 rotate-12" />
                  <div className="relative z-10 space-y-6">
                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <ShieldCheck size={10} /> Security Core
                    </h4>
                    <div className="space-y-4">
                      {[
                        { label: "Active Sync", val: studioStatus },
                        { label: "System Health", val: `${stats.health}%` },
                        { label: "Cloud Link", val: "Established" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2">
                          <span className="text-[8px] font-bold text-stone-500 uppercase">{item.label}</span>
                          <span className="text-lg font-serif italic text-[#a9b897]">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#a9b897] p-6 rounded-[2rem] space-y-3 relative overflow-hidden">
                   <Sparkles size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-stone-900/40">Neural Insight</span>
                   <p className="text-xl font-serif italic text-stone-900 leading-tight">Short-form video nodes are performing <span className="underline decoration-white underline-offset-4">40% better</span> this cycle.</p>
                </div>

                <div className="bg-white border border-stone-100 p-6 rounded-[2rem] shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Sync Pipeline</span>
                     <RefreshCcw size={12} className={`text-stone-300 ${studioStatus === 'Syncing' ? 'animate-spin' : ''}`} />
                   </div>
                   <div className="space-y-3">
                      {[65, 40, 85].map((w, i) => (
                        <div key={i} className="h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} className="h-full bg-stone-200" />
                        </div>
                      ))}
                   </div>
                </div>
              </aside>
            </motion.div>
          )}

          {/* --- VIEW: SCHEDULER --- */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <header className="flex justify-between items-end border-b border-stone-100 pb-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Temporal Mapping</p>
                  <h1 className="text-5xl font-serif italic text-stone-900">Chronos Grid</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewMode('stream')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${viewMode === 'stream' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400'}`}>Stream</button>
                  <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${viewMode === 'calendar' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400'}`}>Grid</button>
                </div>
              </header>

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-serif italic text-stone-900">{cal.monthName}</h2>
                      <div className="flex gap-1">
                        <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-400"><ChevronLeft size={16}/></button>
                        <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-400"><ChevronRight size={16}/></button>
                      </div>
                   </div>
                   <div className="grid grid-cols-7 gap-3">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[8px] font-black text-stone-300 uppercase text-center tracking-widest">{d}</div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const day = i - cal.firstDay + 1;
                        const isCurrent = day > 0 && day <= cal.days;
                        const hasPost = isCurrent && (day === 12 || day === 15 || day === 24);
                        return (
                          <div key={i} className={`aspect-square border border-stone-50 rounded-xl flex flex-col items-center justify-center relative hover:bg-stone-50 transition-colors cursor-pointer group ${!isCurrent ? 'opacity-0' : ''}`}>
                            <span className="text-lg font-serif italic text-stone-300 group-hover:text-stone-900">{isCurrent ? day : ''}</span>
                            {hasPost && <div className="absolute bottom-2 w-1 h-1 rounded-full bg-[#a9b897]" />}
                          </div>
                        );
                      })}
                   </div>
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-4">
                   <div className="flex items-center gap-3 px-1">
                      <h4 className="text-[8px] font-black uppercase tracking-widest text-stone-300">Queue Nodes</h4>
                      <div className="h-px flex-1 bg-stone-50" />
                   </div>
                   {drafts.slice(0, 4).map(post => (
                     <div key={post.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-stone-50 overflow-hidden">
                              <img src={post.media_url} className="w-full h-full object-cover grayscale" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-[#a9b897] uppercase leading-none">{post.platform}</p>
                              <p className="text-xs font-serif italic text-stone-600 line-clamp-1">"{post.caption}"</p>
                           </div>
                        </div>
                        <span className="text-[7px] font-black text-stone-300">09:00</span>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- VIEW: ANALYTICS --- */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8" ref={reportRef}>
               <header className="flex justify-between items-end border-b border-stone-100 pb-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Performance Audit</p>
                    <h1 className="text-5xl font-serif italic text-stone-900 leading-none tracking-tight">System Audit</h1>
                  </div>
                  <button onClick={exportAuditReport} className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                    <Download size={14} /> Export PDF
                  </button>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { l: "Aggregated Reach", v: stats.reach, t: "+12.4%" },
                    { l: "Engagement Rate", v: stats.engagement, t: "+0.4%" },
                    { l: "Net Growth", v: stats.growth, t: "+84" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-stone-100 text-center space-y-2 relative group hover:border-[#a9b897] transition-all">
                       <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">{stat.l}</p>
                       <p className="text-5xl font-serif italic text-stone-900 transition-transform group-hover:scale-105">{stat.v}</p>
                       <span className="inline-block px-2 py-0.5 bg-[#a9b897]/10 text-[#a9b897] text-[8px] font-black rounded-full">{stat.t}</span>
                    </div>
                  ))}
               </div>

               <div className="bg-stone-900 rounded-[2.5rem] p-10 text-white flex items-center justify-between relative overflow-hidden group">
                  <BarChart3 size={120} className="absolute -right-5 opacity-5 group-hover:opacity-10 transition-opacity" />
                  <div className="space-y-3 relative z-10">
                     <div className="w-8 h-8 rounded-lg bg-[#a9b897]/20 flex items-center justify-center text-[#a9b897]">
                        <Activity size={16} />
                     </div>
                     <p className="text-3xl font-serif italic max-w-xl leading-snug">The current content trajectory is <span className="text-[#a9b897]">optimal</span>. Scaling LinkedIn operations by 15% is recommended.</p>
                  </div>
                  <div className="hidden lg:block text-right space-y-1 relative z-10 border-l border-white/5 pl-8">
                     <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Prime Post Time</p>
                     <p className="text-2xl font-serif italic text-[#a9b897]">18:30 GMT</p>
                  </div>
               </div>
            </motion.div>
          )}

          {/* --- VIEW: GALLERY --- */}
          {activeTab === "gallery" && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <header className="flex justify-between items-end border-b border-stone-100 pb-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Media Repository</p>
                    <h1 className="text-5xl font-serif italic text-stone-900">The Vault</h1>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white border border-stone-100 rounded-lg text-stone-300"><Filter size={14}/></button>
                    <button className="px-5 py-2 bg-stone-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                      <Plus size={12}/> Collection
                    </button>
                  </div>
               </header>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {drafts.map((post) => (
                    <div key={post.id} className="aspect-[3/4] rounded-2xl overflow-hidden group relative bg-white border border-stone-50 shadow-sm">
                       <img src={post.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                       <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform"><Eye size={14}/></button>
                          <button className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform"><Download size={14}/></button>
                       </div>
                       <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-[6px] font-black uppercase tracking-widest text-white/50">{post.format}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- CORE STYLES --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E5E0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #a9b897; }
        .antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}