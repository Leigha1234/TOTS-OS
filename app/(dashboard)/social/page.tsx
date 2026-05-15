"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Sparkles, ChevronLeft, ChevronRight, 
  Activity, ShieldCheck, Heart, Zap, Radio,
  Share2, ArrowUpRight, Upload, Download, Globe, 
  Calendar as CalendarIcon, List, Eye, Clock,
  MoreHorizontal, Hash, MessageSquare, Image as ImageIcon,
  CheckCircle2, AlertCircle, Settings, User
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types & Constants ---
type Platform = "Instagram" | "LinkedIn" | "Twitter" | "Threads" | "TikTok";
type PostFormat = "Image" | "Video" | "Carousel";
type PostType = "Promotional" | "Comedic" | "Educational" | "Behind the Scenes" | "Lifestyle";

const platforms: Platform[] = ["Instagram", "LinkedIn", "Twitter", "Threads", "TikTok"];
const postFormats: PostFormat[] = ["Image", "Video", "Carousel"];
const postTypes: PostType[] = ["Promotional", "Comedic", "Educational", "Behind the Scenes", "Lifestyle"];

interface DraftPost {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  status: "Draft" | "Scheduled" | "Published";
  scheduled_date: string;
  tags: string[];
  format?: PostFormat;
  type?: PostType;
}

// --- Component Start ---
export default function SocialStudioPro() {
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler" | "gallery" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>("Image");
  const [selectedType, setSelectedType] = useState<PostType>("Promotional");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('calendar');
  const [selectedDatePosts, setSelectedDatePosts] = useState<DraftPost[] | null>(null);
  const [stats, setStats] = useState({ reach: "12.4k", engagement: "5.2%", growth: "842" });
  const [currentDate, setCurrentDate] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Initialization & Realtime ---
  useEffect(() => {
    setIsMounted(true);
    fetchInitialData();

    // Setup Realtime: Define listeners before subscribing
    const channel = supabase.channel('social_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team' }, (payload) => {
        console.log('Team Update:', payload);
        toast.info("Team data synchronized");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInitialData = async () => {
    // Fetching from 'team' table (recently renamed)
    const { data: posts } = await supabase.from('tasks').select('*').limit(10);
    if (posts) {
      const formatted = posts.map(p => ({
        id: p.id,
        platform: "LinkedIn" as Platform,
        caption: p.title || "Project Milestone",
        media_url: `https://picsum.photos/seed/${p.id}/800/1000`,
        status: "Published" as const,
        scheduled_date: new Date().toISOString().split('T')[0],
        tags: ["System"],
        format: "Image" as PostFormat
      }));
      setDrafts(formatted);
    }
  };

  // --- Core Functionality ---

  const handlePostCreation = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);

    try {
      if (isManualMode) {
        // Bypass AI Synthesis
        const manualPost: DraftPost = {
          id: `MAN-${Date.now()}`,
          platform: selectedPlatform,
          caption: prompt,
          media_url: `https://picsum.photos/seed/${Math.random()}/800/1000`,
          status: "Draft",
          scheduled_date: new Date().toISOString().split('T')[0],
          tags: ["Manual"],
          format: selectedFormat,
          type: selectedType
        };
        setDrafts(prev => [manualPost, ...prev]);
        toast.success("Manual draft created");
      } else {
        // AI Synthesis Path
        await new Promise(r => setTimeout(r, 2000));
        const aiPost: DraftPost = {
          id: `AI-${Date.now()}`,
          platform: selectedPlatform,
          caption: `✨ [AI Suggested ${selectedType}]: ${prompt}\n\n#${selectedType.replace(" ", "")} #Innovation`,
          media_url: `https://picsum.photos/seed/${Math.random()}/800/1000`,
          status: "Draft",
          scheduled_date: new Date().toISOString().split('T')[0],
          tags: ["AI-Gen", selectedType],
          format: selectedFormat,
          type: selectedType
        };
        setDrafts(prev => [aiPost, ...prev]);
        toast.success("AI Synthesis complete");
      }
    } finally {
      setIsGenerating(false);
      setPrompt("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const upload: DraftPost = {
        id: `UP-${Date.now()}`,
        platform: selectedPlatform,
        caption: "Uploaded Media Asset",
        media_url: reader.result as string,
        status: "Draft",
        scheduled_date: new Date().toISOString().split('T')[0],
        tags: ["User-Upload"]
      };
      setDrafts(prev => [upload, ...prev]);
      toast.success("Media imported to Lab");
    };
    reader.readAsDataURL(file);
  };

  // --- Analytics & Export Logic ---

  const generatePDF = async () => {
    if (!reportRef.current) return;
    toast.info("Preparing high-resolution PDF...");
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FBFBFA"
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`TOTs-Social-Report-${Date.now()}.pdf`);
    toast.success("Report downloaded");
  };

  const sharePDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current);
    canvas.toBlob(async (blob) => {
      if (blob && navigator.share) {
        const file = new File([blob], 'social-report.pdf', { type: 'application/pdf' });
        try {
          await navigator.share({
            files: [file],
            title: 'Social Performance Report',
            text: 'Sharing the latest social metrics from TOTs OS.',
          });
        } catch (err) {
          console.error("Sharing failed", err);
        }
      } else {
        toast.error("Sharing not supported on this browser");
      }
    });
  };

  // --- Calendar Helpers ---
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, month, year };
  }, [currentDate]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 pb-20 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-stone-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 flex items-center justify-center text-[#a9b897]">
              <Radio size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Studio</span>
          </div>
          
          <div className="flex items-center gap-2 bg-stone-100/50 p-1 rounded-2xl">
            {["lab", "scheduler", "gallery", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Live Sync</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
            <User size={16} />
          </div>
        </div>
      </nav>

      <div className="max-w-[1650px] mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          
          {/* --- TAB: LAB --- */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-16">
              <div className="col-span-12 lg:col-span-8 space-y-12">
                <header className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-4">Content Synthesis</p>
                    <h1 className="text-8xl font-serif italic tracking-tighter text-stone-900">Social Lab</h1>
                  </div>
                  <div className="flex items-center gap-4 pb-4">
                    <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/50">
                      <button onClick={() => setIsManualMode(false)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isManualMode ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400'}`}>AI Sync</button>
                      <button onClick={() => setIsManualMode(true)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isManualMode ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400'}`}>Manual</button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-stone-200 rounded-2xl hover:border-[#a9b897] transition-all text-stone-400 hover:text-[#a9b897]">
                      <Upload size={20} />
                    </button>
                  </div>
                </header>

                <div className="bg-white rounded-[4rem] border border-stone-100 p-12 shadow-sm space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section className="space-y-6">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Platform Matrix</label>
                      <div className="flex flex-wrap gap-3">
                        {platforms.map(p => (
                          <button key={p} onClick={() => setSelectedPlatform(p)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedPlatform === p ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-6">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Format Selection</label>
                      <div className="flex flex-wrap gap-3">
                        {postFormats.map(f => (
                          <button key={f} onClick={() => setSelectedFormat(f)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedFormat === f ? 'bg-[#a9b897] text-white border-[#a9b897] shadow-lg shadow-[#a9b897]/20' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{f}</button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Content Archetype</label>
                    <div className="flex flex-wrap gap-3">
                      {postTypes.map(t => (
                        <button key={t} onClick={() => setSelectedType(t)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedType === t ? 'bg-stone-900 text-[#a9b897] border-stone-900' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isManualMode ? "Compose your post content directly here..." : "Describe the creative objective for the synthesis engine..."}
                      className="w-full h-72 bg-stone-50/50 rounded-[3rem] p-10 text-3xl font-serif italic outline-none text-stone-800 placeholder-stone-200 focus:bg-white border border-transparent focus:border-stone-100 transition-all resize-none"
                    />
                    <div className="absolute bottom-8 right-8">
                      <button
                        onClick={handlePostCreation}
                        disabled={!prompt || isGenerating}
                        className="bg-[#a9b897] text-white px-12 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-[#a9b897]/40 disabled:opacity-20 transition-all flex items-center gap-4 hover:scale-[1.02] active:scale-95"
                      >
                        {isGenerating ? "Synthesizing Node..." : isManualMode ? "Draft Manual Post" : "Generate Lab Post"}
                        <Zap size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Active Drafts</h3>
                    <div className="h-px flex-1 bg-stone-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {drafts.filter(d => d.status === "Draft").map((draft) => (
                      <motion.div layout key={draft.id} className="bg-white rounded-[3rem] p-5 border border-stone-100 group shadow-sm hover:shadow-2xl transition-all duration-700">
                        <div className="aspect-[4/5] relative rounded-[2.5rem] overflow-hidden mb-8 bg-stone-50">
                          <img src={draft.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" />
                          <div className="absolute top-6 left-6 flex gap-2">
                            <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">{draft.platform}</span>
                            <span className="bg-stone-900/90 text-[#a9b897] backdrop-blur px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">{draft.type}</span>
                          </div>
                        </div>
                        <div className="px-6 pb-6 space-y-6">
                          <p className="text-lg font-serif italic text-stone-600 leading-relaxed line-clamp-3">"{draft.caption}"</p>
                          <div className="flex gap-4 pt-4">
                            <button className="flex-1 bg-stone-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-stone-200">Schedule Node</button>
                            <button onClick={() => setDrafts(prev => prev.filter(p => p.id !== draft.id))} className="p-5 bg-stone-50 text-stone-300 rounded-2xl hover:text-red-400 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-[#a9b897] text-white p-14 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                  <ShieldCheck size={300} className="absolute -right-20 -top-20 opacity-5 rotate-12 transition-transform group-hover:rotate-45 duration-1000" />
                  <div className="relative z-10 space-y-12">
                    <header className="space-y-3">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-50">System Health</h3>
                      <p className="text-5xl font-serif italic tracking-tighter leading-none">Creative Engine.</p>
                    </header>
                    <div className="space-y-8 pt-12 border-t border-white/10">
                      {[
                        { label: "Active Platform", val: selectedPlatform },
                        { label: "Post Logic", val: isManualMode ? "Manual Override" : "AI Sync" },
                        { label: "Format Optimization", val: selectedFormat },
                        { label: "Content DNA", val: selectedType }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-end group/item">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 transition-opacity group-hover/item:opacity-100">{item.label}</p>
                          <p className="text-2xl font-serif italic">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Link href="/settings/team" className="block group">
                  <div className="bg-white border border-stone-100 p-12 rounded-[4rem] space-y-8 shadow-sm hover:border-[#a9b897] transition-all duration-500">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300 group-hover:text-[#a9b897]">Team Nexus</h3>
                      <ArrowUpRight size={20} className="text-stone-300 group-hover:text-[#a9b897] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-stone-50 flex items-center justify-center font-bold text-stone-400 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all text-xl">D</div>
                      <div>
                        <p className="text-lg font-bold text-stone-800">Team Collaboration</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">app/settings/team</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="bg-stone-900 p-12 rounded-[4rem] space-y-8 text-white relative overflow-hidden">
                  <Sparkles size={100} className="absolute -right-8 -bottom-8 opacity-10" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 text-[#a9b897]">Quick Insights</h4>
                  <p className="text-3xl font-serif italic tracking-tight relative z-10">Peak engagement predicted for tomorrow at <span className="text-[#a9b897]">18:45</span> based on current trends.</p>
                </div>
              </aside>
            </motion.div>
          )}

          {/* --- TAB: SCHEDULER --- */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-stone-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-4">Chronos Control</p>
                  <h1 className="text-8xl font-serif italic tracking-tighter text-stone-900 leading-none">Scheduler</h1>
                </div>
                <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-stone-100 shadow-sm">
                  <button onClick={() => setViewMode('stream')} className={`px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'stream' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}>Stream View</button>
                  <button onClick={() => setViewMode('calendar')} className={`px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}>Calendar View</button>
                </div>
              </header>

              {viewMode === 'calendar' ? (
                <div className="grid grid-cols-12 gap-16">
                  <div className="col-span-12 lg:col-span-8 bg-white border border-stone-100 rounded-[5rem] p-20 shadow-sm">
                    <div className="flex items-center justify-between mb-20">
                      <h2 className="text-6xl font-serif italic text-stone-900">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                      <div className="flex gap-3">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-5 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all border border-stone-100"><ChevronLeft size={20}/></button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-5 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all border border-stone-100"><ChevronRight size={20}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-6">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[12px] font-black uppercase text-stone-300 text-center tracking-[0.5em] mb-10">{d}</div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const day = i - calendarGrid.firstDay + 1;
                        const isCurrentMonth = day > 0 && day <= calendarGrid.daysInMonth;
                        const hasPost = isCurrentMonth && (day % 4 === 0);
                        
                        return (
                          <div 
                            key={i} 
                            onClick={() => isCurrentMonth && setSelectedDatePosts(hasPost ? drafts.slice(0, 2) : [])}
                            className={`aspect-square border border-stone-50 rounded-[2.5rem] p-8 transition-all cursor-pointer relative flex flex-col items-center justify-center group ${
                              !isCurrentMonth ? 'opacity-10' : 'bg-stone-50/20 hover:bg-white hover:shadow-2xl hover:border-[#a9b897]/30'
                            }`}
                          >
                            <span className={`text-2xl font-serif italic ${isCurrentMonth ? 'text-stone-400 group-hover:text-stone-900' : ''}`}>{isCurrentMonth ? day : ''}</span>
                            {hasPost && (
                              <div className="absolute bottom-6 w-2 h-2 rounded-full bg-[#a9b897] shadow-lg shadow-[#a9b897]/50" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 space-y-10">
                    <div className="flex items-center gap-4 px-4">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Daily Manifest</h3>
                      <div className="h-px flex-1 bg-stone-100" />
                    </div>
                    <div className="space-y-6">
                      {selectedDatePosts && selectedDatePosts.length > 0 ? selectedDatePosts.map(post => (
                        <div key={post.id} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-4 hover:border-[#a9b897] transition-all">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">{post.platform}</span>
                            <div className="flex items-center gap-2 text-stone-300">
                              <Clock size={12}/>
                              <span className="text-[9px] font-black uppercase tracking-widest">09:00 AM</span>
                            </div>
                          </div>
                          <p className="text-xl font-serif italic text-stone-700 line-clamp-2">"{post.caption}"</p>
                        </div>
                      )) : (
                        <div className="py-24 px-12 text-center border-2 border-dashed border-stone-100 rounded-[4rem] text-stone-300 space-y-4">
                          <CalendarIcon size={32} className="mx-auto opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Select a day with nodes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {drafts.map(post => (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={post.id} className="bg-white p-10 rounded-[3rem] border border-stone-100 flex items-center justify-between group hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center gap-12">
                        <div className="w-40 h-24 rounded-[1.5rem] overflow-hidden grayscale bg-stone-50 group-hover:grayscale-0 transition-all duration-700">
                          <img src={post.media_url} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">{post.platform}</span>
                            <span className="w-1 h-1 rounded-full bg-stone-200" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">{post.format}</span>
                          </div>
                          <h4 className="text-3xl font-serif italic text-stone-800 line-clamp-1">{post.caption}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-1">Scheduled for</p>
                          <p className="text-xl font-serif italic">{post.scheduled_date}</p>
                        </div>
                        <button className="p-6 bg-stone-50 text-stone-400 rounded-[2rem] group-hover:bg-stone-900 group-hover:text-white transition-all"><MoreHorizontal size={20}/></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- TAB: ANALYTICS --- */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
               <div id="social-report-container" ref={reportRef} className="space-y-16 bg-[#FBFBFA] p-12 rounded-[5rem]">
                 <header className="flex justify-between items-end mb-8">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#a9b897] mb-4">Performance Audit</p>
                      <h2 className="text-7xl font-serif italic tracking-tighter text-stone-900 leading-tight">Insight Mapping.</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Generated on</p>
                      <p className="text-2xl font-serif italic">{new Date().toLocaleDateString()}</p>
                    </div>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                      { label: "Aggregate Reach", val: stats.reach, trend: "+12.4%", icon: <Globe /> },
                      { label: "Engagement Rate", val: stats.engagement, trend: "+0.8%", icon: <Heart /> },
                      { label: "Follower Delta", val: stats.growth, trend: "+142", icon: <Activity /> }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-14 rounded-[4.5rem] border border-stone-100 shadow-sm space-y-8 relative overflow-hidden group">
                         <div className="flex justify-between items-start relative z-10">
                            <div className="p-5 bg-stone-50 rounded-2xl text-[#a9b897] transition-colors group-hover:bg-stone-900 group-hover:text-white">{stat.icon}</div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/5 px-5 py-2.5 rounded-full">{stat.trend}</span>
                         </div>
                         <div className="relative z-10">
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-300 mb-4">{stat.label}</p>
                            <p className="text-8xl font-serif italic tracking-tighter text-stone-900 group-hover:scale-105 transition-transform duration-700 origin-left">{stat.val}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-12 gap-12">
                    <div className="col-span-12 lg:col-span-7 bg-stone-900 rounded-[5rem] p-20 text-white relative overflow-hidden">
                       <Sparkles size={400} className="absolute -right-20 -bottom-20 opacity-5" />
                       <div className="relative z-10 space-y-12">
                          <h3 className="text-5xl font-serif italic tracking-tight leading-tight">Your content resonance has increased by <span className="text-[#a9b897]">18%</span> since shifting to {selectedType} archetypes.</h3>
                          <div className="flex gap-6">
                             <button onClick={generatePDF} className="px-12 py-6 bg-[#a9b897] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-[#a9b897]/30 transition-all hover:scale-105 flex items-center gap-3">
                               <Download size={16}/> Download PDF Report
                             </button>
                             <button onClick={sharePDF} className="px-12 py-6 border border-white/10 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all flex items-center gap-3">
                               <Share2 size={16}/> Share Analytics
                             </button>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-12 lg:col-span-5 bg-white border border-stone-100 rounded-[5rem] p-16 space-y-12">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">Audience Pulse</h4>
                       <div className="space-y-8">
                          {[
                            { platform: "Instagram", value: 88, color: "#a9b897" },
                            { platform: "LinkedIn", value: 64, color: "#2d2d2d" },
                            { platform: "Twitter", value: 42, color: "#e5e5e5" }
                          ].map((item, i) => (
                            <div key={i} className="space-y-4">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                  <span>{item.platform}</span>
                                  <span>{item.value}%</span>
                               </div>
                               <div className="h-2 bg-stone-50 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1.5, delay: i * 0.2 }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}

          {/* --- TAB: GALLERY --- */}
          {activeTab === "gallery" && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              <header className="pb-12 border-b border-stone-100">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-4">Visual Repository</p>
                <h1 className="text-8xl font-serif italic tracking-tighter text-stone-900 leading-none">Studio Gallery</h1>
              </header>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {drafts.length > 0 ? drafts.map((post, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={post.id} 
                    className="aspect-square bg-white border border-stone-100 rounded-[3rem] p-4 group relative cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden"
                  >
                    <div className="w-full h-full rounded-[2rem] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 bg-stone-50">
                       <img src={post.media_url} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" />
                    </div>
                    <div className="absolute inset-0 bg-stone-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-8 text-center backdrop-blur-sm">
                       <p className="text-white font-serif italic text-sm line-clamp-3">"{post.caption}"</p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-40 text-center border-2 border-dashed border-stone-100 rounded-[5rem] space-y-6">
                    <ImageIcon size={48} className="mx-auto opacity-10" />
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-200">No media nodes present in vault</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- FOOTER / LOGO --- */}
      <footer className="max-w-[1650px] mx-auto px-12 py-12 border-t border-stone-100 flex justify-between items-center opacity-30">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-lg bg-stone-900" />
           <p className="text-[9px] font-black uppercase tracking-[0.4em]">TOTs OS // Social Engine v2.4</p>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Secure Node: snytzitsegmcnochsnnl</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        @media print {
          nav, aside, button, footer { display: none !important; }
          #social-report-container { padding: 0 !important; width: 100% !important; }
        }
      `}} />
    </div>
  );
}