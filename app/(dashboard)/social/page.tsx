"use client";

import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, RefreshCcw, Layers, Upload, Sparkles, 
  Hash, Clock, X, Calendar as CalIcon, ArrowRight, Save, BrainCircuit, TrendingUp, 
  BarChart3, Video, Image as ImageIcon, Wand2, Pin, Instagram, Linkedin, Twitter,
  CheckCircle2, Globe, Eye, Settings, Info, LayoutGrid, Cpu, Plus, MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --- Types ---
interface SocialPost {
  id: string;
  caption: string;
  platform: string;
  hashtags?: string;
  media_url: string;
  scheduled_for: string;
  status: string;
  format: string;
}

export default function SocialStudioUnified() {
  // Navigation & UI State
  const [viewMode, setViewMode] = useState<"lab" | "planner">("lab");
  const [status, setStatus] = useState("Ready");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [selectedDayPosts, setSelectedDayPosts] = useState<SocialPost[]>([]);

  // Production Form State
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("Post");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  
  // Logic State
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Data Sync ---
  const syncPosts = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .order('scheduled_for', { ascending: true });
    
    if (!error) setPosts(data || []);
    setStatus("Ready");
  };

  useEffect(() => { syncPosts(); }, [supabase]);

  // --- AI Engines ---
  const handleAICaption = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    setCaption("Elevating the digital workflow. Experience the precision of TOTs OS—where design meets seamless execution.");
    setIsGenerating(false);
    toast.success("AI: Narrative Synthesized");
  };

  const handleAIVisual = async (type: 'Image' | 'Video') => {
    setIsGenerating(true);
    setStatus(`Rendering ${type}...`);
    await new Promise(r => setTimeout(r, 2000));
    const url = type === 'Image' 
      ? `https://picsum.photos/seed/${Math.random()}/1080/1350` 
      : "https://www.w3schools.com/html/mov_bbb.mp4";
    setMediaPreview(url);
    setFormat(type === 'Image' ? 'Post' : 'Reel');
    setIsGenerating(false);
    setStatus("Ready");
    toast.success(`AI ${type} Ready`);
  };

  // --- Calendar Interactions ---
  const handleDateClick = (day: number) => {
    if (day === 0) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayPosts = posts.filter(p => {
      const d = new Date(p.scheduled_for);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    if (dayPosts.length > 0) {
      setSelectedDayPosts(dayPosts);
      setIsDayViewOpen(true);
    } else {
      // Empty date: Pre-fill time and jump to Lab
      const isoString = new Date(clickedDate.setHours(12, 0, 0, 0)).toISOString().slice(0, 16);
      setScheduledTime(isoString);
      setViewMode("lab");
      toast(`Scheduling for ${clickedDate.toLocaleDateString()}`);
    }
  };

  // --- Database Action ---
  const savePost = async () => {
    if (!caption || !scheduledTime) return toast.error("Please provide a caption and schedule time.");
    
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
      toast.success("Deployment successful.");
      setCaption(""); setMediaPreview(null); syncPosts();
    } else {
      toast.error("Cloud rejection: Sync failed.");
    }
    setStatus("Ready");
  };

  // --- Calendar Helpers ---
  const calendarDays = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(0);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1c1c1c] font-sans antialiased flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="h-20 px-10 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-[#a9b897] shadow-lg"><Layers size={18}/></div>
             <span className="font-serif italic text-2xl tracking-tighter">Social.OS</span>
          </div>
          
          <div className="flex bg-stone-50 p-1 rounded-2xl border border-stone-100">
             <button onClick={() => setViewMode('lab')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'lab' ? 'bg-white shadow-sm text-[#1c1c1c]' : 'text-stone-300'}`}>Production Lab</button>
             <button onClick={() => setViewMode('planner')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'planner' ? 'bg-white shadow-sm text-[#1c1c1c]' : 'text-stone-300'}`}>Grid Planner</button>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 rounded-full border border-stone-100">
             <div className={`w-1.5 h-1.5 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`}/>
             <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{status}</span>
           </div>
           <button onClick={syncPosts} className="p-2 text-stone-300 hover:text-[#1c1c1c] transition-colors"><RefreshCcw size={18}/></button>
           <Link href="/reports" className="p-2 text-stone-300 hover:text-[#1c1c1c] transition-colors"><BarChart3 size={18}/></Link>
        </div>
      </nav>

      {/* Main Content View */}
      <main className="flex-1 p-10 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* VIEW: PRODUCTION LAB */}
          {viewMode === 'lab' ? (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto grid grid-cols-12 gap-12">
              <div className="col-span-12 lg:col-span-7 space-y-8">
                <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50 flex flex-col justify-between min-h-[550px]">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-300">Narrative Draft</label>
                      <button onClick={handleAICaption} className="flex items-center gap-2 text-[10px] font-black uppercase text-[#a9b897] hover:opacity-60 transition-opacity">
                        <Sparkles size={14}/> AI Optimize
                      </button>
                    </div>
                    <textarea 
                      value={caption} 
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full h-48 bg-transparent text-5xl font-serif italic outline-none resize-none placeholder:text-stone-100 leading-tight"
                      placeholder="Start typing your vision..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-stone-50">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Platform</label>
                      <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-4 bg-stone-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-stone-100">
                         <option value="instagram">Instagram</option>
                         <option value="tiktok">TikTok</option>
                         <option value="linkedin">LinkedIn</option>
                         <option value="pinterest">Pinterest</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-2"><Clock size={12}/> Production Schedule</label>
                      <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full p-4 bg-stone-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-stone-100" />
                    </div>
                  </div>

                  <button onClick={savePost} className="w-full py-8 mt-8 bg-[#1c1c1c] text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-stone-800 transition-all shadow-xl">
                    Deploy Node <CheckCircle2 size={18} className="text-[#a9b897]"/>
                  </button>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5 space-y-8">
                <div className="aspect-[4/5] bg-white rounded-[3.5rem] border border-stone-100 shadow-2xl relative overflow-hidden group">
                  {mediaPreview ? (
                    mediaPreview.includes('.mp4') 
                      ? <video src={mediaPreview} autoPlay loop muted className="w-full h-full object-cover" />
                      : <img src={mediaPreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-100 space-y-4">
                      <ImageIcon size={48} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Asset Null</p>
                    </div>
                  )}
                  <div className="absolute top-8 left-8 flex gap-2">
                    {['Post', 'Story', 'Reel'].map(f => (
                      <button key={f} onClick={() => setFormat(f)} className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase border transition-all ${format === f ? 'bg-white text-[#1c1c1c] border-transparent shadow-lg' : 'bg-black/10 text-white border-white/20'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => handleAIVisual('Image')} className="flex-1 py-4 bg-white border border-stone-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:shadow-lg transition-all">Gen Image</button>
                   <button onClick={() => handleAIVisual('Video')} className="flex-1 py-4 bg-[#a9b897] text-[#1c1c1c] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-all">Gen Video</button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* VIEW: PLANNER CALENDAR */
            <motion.div key="planner" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto space-y-12">
               <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-6">
                    <h2 className="text-8xl font-serif italic tracking-tighter">{currentDate.toLocaleString('default', { month: 'long' })}.</h2>
                    <span className="text-stone-300 text-3xl font-serif italic leading-none">{currentDate.getFullYear()}</span>
                  </div>
                  <div className="flex gap-2 bg-white p-2 rounded-2xl border border-stone-100 shadow-sm">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 hover:bg-stone-50 rounded-xl transition-all"><ChevronLeft size={18}/></button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 hover:bg-stone-50 rounded-xl transition-all"><ChevronRight size={18}/></button>
                  </div>
               </div>

               <div className="grid grid-cols-7 gap-5 bg-white p-16 rounded-[4rem] border border-stone-100 shadow-2xl">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                   <div key={d} className="text-center text-[10px] font-black text-stone-200 uppercase tracking-[0.3em] mb-10">{d}</div>
                 ))}
                 {calendarDays.map((day, i) => {
                   const dayPosts = posts.filter(p => {
                     const d = new Date(p.scheduled_for);
                     return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                   });
                   return (
                     <div 
                      key={i} 
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-[2rem] border border-stone-50 flex items-center justify-center text-4xl font-serif italic relative cursor-pointer group transition-all
                        ${day === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-stone-50 hover:border-stone-100'}
                        ${dayPosts.length > 0 ? 'text-[#1c1c1c]' : 'text-stone-100'}
                      `}
                     >
                        {day > 0 ? day : ""}
                        {dayPosts.length > 0 && <div className="absolute bottom-5 w-2 h-2 rounded-full bg-[#a9b897] shadow-[0_0_12px_#a9b897]" />}
                     </div>
                   );
                 })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Slide-out Day View Drawer */}
      <AnimatePresence>
        {isDayViewOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDayViewOpen(false)} className="absolute inset-0 bg-stone-100/40 backdrop-blur-md" />
             <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-100 p-12 flex flex-col">
                <div className="flex justify-between items-center mb-12">
                   <h3 className="text-4xl font-serif italic">Day Agenda.</h3>
                   <button onClick={() => setIsDayViewOpen(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-4">
                  {selectedDayPosts.map((post) => (
                    <div key={post.id} className="bg-stone-50 rounded-[2.5rem] p-6 space-y-4 border border-stone-100 group">
                       <div className="flex gap-6">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm">
                             <img src={post.media_url} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 py-1">
                             <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">{post.platform}</p>
                             <p className="text-sm font-serif italic text-stone-600 line-clamp-2 leading-snug">"{post.caption}"</p>
                          </div>
                       </div>
                       <div className="flex justify-between items-center pt-4 border-t border-stone-100/50">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-stone-300 uppercase">
                             <Clock size={12}/> {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <button className="text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                       </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => { setViewMode('lab'); setIsDayViewOpen(false); }}
                  className="w-full py-6 mt-10 border-2 border-dashed border-stone-200 rounded-3xl flex items-center justify-center gap-3 text-[10px] font-black uppercase text-stone-300 hover:border-[#a9b897] hover:text-[#a9b897] transition-all"
                >
                  <Plus size={16}/> Add New Content
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIXED AI FLOATING BUTTON */}
      <Link href="/clarity">
        <button className="fixed bottom-12 right-12 w-20 h-20 bg-[#1c1c1c] text-[#a9b897] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-[100] group">
          <div className="absolute -top-14 right-0 bg-[#1c1c1c] text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
            Enter Clarity Mode
          </div>
          <Sparkles size={30} />
        </button>
      </Link>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { opacity: 0.1; cursor: pointer; }
      `}</style>
    </div>
  );
}