"use client";

import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, RefreshCcw, Layers, Sparkles, Hash, Clock, X, 
  ArrowRight, BarChart3, Video, Instagram, Linkedin, 
  Plus, Film, Music, ChevronLeft, ChevronRight, Upload, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// --- System Types ---
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

interface ContentConcept {
  id: string;
  title: string;
  trendAngle: string;
  format: "Reel" | "TikTok" | "Post" | "Carousel";
  script: string;
  caption: string;
  hashtags: string;
  recommendedAudio: string;
}

export default function SocialStudioUnified() {
  // Navigation & UI State
  const [viewMode, setViewMode] = useState<"lab" | "planner">("lab");
  const [status, setStatus] = useState("Ready");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [selectedDayPosts, setSelectedDayPosts] = useState<SocialPost[]>([]);

  // Business Context State
  const [businessContext, setBusinessContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedConcepts, setGeneratedConcepts] = useState<ContentConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<ContentConcept | null>(null);

  // Production Form State (Manual Edit / AI Apply Canvas)
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("Post");
  const [scheduledTime, setScheduledTime] = useState("");
  const [metaScript, setMetaScript] = useState("");
  const [metaAudio, setMetaAudio] = useState("");
  
  // Media Upload State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // System Data
  const [posts, setPosts] = useState<SocialPost[]>([]);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Data Sync ---
  const syncPosts = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('socials')
      .select('id, caption, platform, hashtags, media_url, scheduled_for, status, format')
      .order('scheduled_for', { ascending: true });
    
    if (!error) {
      setPosts(data || []);
    } else {
      console.error("Fetch error:", error);
      toast.error("Error reading from database check console.");
    }
    setStatus("Ready");
  };

  useEffect(() => { 
    syncPosts(); 
  }, [supabase]);

  // --- Handle Local File Selection ---
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const localUrl = URL.createObjectURL(file);
      setMediaPreview(localUrl);
      toast.success(`Loaded file: ${file.name}`);
    }
  };

  // --- AI Concept Generation Engine ---
  const analyzeBusinessDNA = async () => {
    if (!businessContext.trim()) return toast.error("Please enter your business context to tailor the ideas.");
    
    setIsAnalyzing(true);
    setStatus("Analyzing Trends...");
    await new Promise(r => setTimeout(r, 2200));

    const mockBlueprints: ContentConcept[] = [
      {
        id: "concept-1",
        title: "The Frictionless Ecosystem",
        trendAngle: "POV / Clean Desk Aesthetic (Highly Trending)",
        format: "Reel",
        script: "Visual: Top-down hyper-lapse of cluttered physical notes transitioning cleanly into a crisp, minimalist workspace UI layout.\n\nAudio Hook (0-3s): Stop glorifying chaotic workflows.\nBody (3-15s): Walkthrough showing the precise layout switch from raw intent to clean cloud sync architecture.\nOutro (15-30s): Call to action to clear the digital noise with the system blueprint link in bio.",
        caption: "Chaos is expensive. Design your way out of it. The new architectural standard for business management tools is officially live. Built for high-intent builders who value digital clarity.",
        hashtags: "#minimalism #workflow #SaaS #productivity #uidesign #workspace #systems",
        recommendedAudio: "Lofi Horizon (Trending Ambient Instrumental) - Pitch-shifted, slows down at 0:12"
      },
      {
        id: "concept-2",
        title: "Behind the Architecture",
        trendAngle: "Raw Truth / Founder Commentary",
        format: "TikTok",
        script: "Visual: Face-to-camera or over-the-shoulder green-screen overlay showing database schemas or code structure.\n\nAudio Hook (0-5s): Why we deleted 600 lines of codebase code to fix one user interface problem.\nBody (5-45s): Transparent explanation of stripping away sidebars to favor full-canvas immersion. Show the human decision-making process behind software evolution.\nOutro (45-60s): Follow to trace the architecture build.",
        caption: "Good design isn't what we add, it's what we have the courage to remove. Moving towards completely full-canvas immersive spaces.",
        hashtags: "#buildinpublic #founder #minimalisttech #techstack #developer #designsystem",
        recommendedAudio: "Original Audio (Spoken Voiceover) layered with 'Metamorphosis' low volume synth"
      },
      {
        id: "concept-3",
        title: "The System Blueprint",
        trendAngle: "Asymmetric Value Delivery / Micro-Infographic",
        format: "Post",
        script: "Visual: High-contrast text layout or clean step-by-step visual documentation breaking down 3 structural pillars of an organized operations stack.",
        caption: "An unorganized brand framework limits execution speed. Here is the architecture we use to track production nodes across networks without breaking schemas.",
        hashtags: "#businessarchitecture #brandstrategy #systemsdesigner #agile #opsmanagement",
        recommendedAudio: "None (Static Post / Carousel Highlight Track)"
      }
    ];

    setGeneratedConcepts(mockBlueprints);
    setSelectedConcept(mockBlueprints[0]);
    applyConceptToForm(mockBlueprints[0]);

    setIsAnalyzing(false);
    setStatus("Ready");
    toast.success("Strategic Campaign Briefs Synthesized.");
  };

  const applyConceptToForm = (concept: ContentConcept) => {
    setCaption(concept.caption);
    setHashtags(concept.hashtags);
    setFormat(concept.format);
    setMetaScript(concept.script);
    setMetaAudio(concept.recommendedAudio);
    
    if (concept.format === "Reel") setPlatform("instagram");
    else if (concept.format === "TikTok") setPlatform("tiktok");
    else setPlatform("linkedin");
  };

  // --- Calendar Integration Mechanics ---
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
      const isoString = new Date(clickedDate.setHours(12, 0, 0, 0)).toISOString().slice(0, 16);
      setScheduledTime(isoString);
      setViewMode("lab");
      toast(`Publish schedule ready for ${clickedDate.toLocaleDateString()}`);
    }
  };

  // --- Deploy / Save Action ---
  const deployToProductionGrid = async () => {
    if (!caption || !scheduledTime) {
      return toast.error("Please fill in the scheduled time and final caption before publishing.");
    }
    
    setStatus("Saving");
    let finalMediaUrl = "https://picsum.photos/seed/system-blueprint/1080/1350"; // Fallback placeholder

    // Visual Upload Routine to Supabase Storage Bucket
    if (mediaFile) {
      setIsUploadingMedia(true);
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('social-assets')
        .upload(filePath, mediaFile);

      if (!uploadError) {
        const { data } = supabase.storage.from('social-assets').getPublicUrl(filePath);
        if (data) finalMediaUrl = data.publicUrl;
      } else {
        console.error("Storage Error:", uploadError);
        toast.error("Media failed to route to bucket asset storage. Using placeholder URL instead.");
      }
      setIsUploadingMedia(false);
    }

    const { error } = await supabase.from('socials').insert([{
      caption: caption,
      platform,
      hashtags,
      media_url: finalMediaUrl, 
      scheduled_for: new Date(scheduledTime).toISOString(),
      status: 'scheduled',
      format: format
    }]);

    if (!error) {
      toast.success("Content item synchronized! Job queued for API delivery pipeline.");
      setCaption(""); 
      setHashtags(""); 
      setMetaScript(""); 
      setMetaAudio(""); 
      setScheduledTime("");
      setMediaFile(null);
      setMediaPreview(null);
      syncPosts();
    } else {
      console.error(error);
      toast.error("Database Save Failure. Check column names.");
    }
    setStatus("Ready");
  };

  // --- Calendar Grid Helpers ---
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
      
      {/* Navigation Header */}
      <nav className="h-20 px-10 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-[#a9b897] shadow-lg"><Layers size={18}/></div>
             <span className="font-serif italic text-2xl tracking-tighter">Social.OS</span>
          </div>
          
          <div className="flex bg-stone-50 p-1 rounded-2xl border border-stone-100">
             <button onClick={() => setViewMode('lab')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'lab' ? 'bg-white shadow-sm text-[#1c1c1c]' : 'text-stone-300'}`}>Strategy Lab</button>
             <button onClick={() => setViewMode('planner')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'planner' ? 'bg-white shadow-sm text-[#1c1c1c]' : 'text-stone-300'}`}>Content Planner</button>
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

      {/* Main Container */}
      <main className="flex-1 p-10 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: STRATEGY LAB & COMPOSITION CANVAS */}
          {viewMode === 'lab' ? (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto grid grid-cols-12 gap-12">
              
              {/* Left Column: AI Engine and Brief Breakdown */}
              <div className="col-span-12 lg:col-span-6 space-y-8">
                
                {/* Context Input */}
                <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-1">Contextual Alignment</p>
                    <h3 className="text-3xl font-serif italic tracking-tight">Tell us about your business</h3>
                  </div>
                  <textarea 
                    value={businessContext}
                    onChange={(e) => setBusinessContext(e.target.value)}
                    placeholder="e.g., We are architectural designers focusing on functional minimalism..."
                    className="w-full h-32 bg-stone-50 rounded-2xl p-6 text-sm font-medium outline-none border border-stone-100/50 focus:border-[#a9b897] transition-all resize-none placeholder:text-stone-300"
                  />
                  <button 
                    onClick={analyzeBusinessDNA}
                    disabled={isAnalyzing}
                    className="w-full py-5 bg-[#1c1c1c] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-stone-800 transition-all disabled:opacity-40"
                  >
                    <Sparkles size={14} className="text-[#a9b897]"/> 
                    {isAnalyzing ? "Analyzing Trends..." : "Generate Trending Ideas"}
                  </button>
                </div>

                {/* AI Generation Selection Tabs */}
                {generatedConcepts.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-300 ml-4">Strategic Content Options</label>
                    <div className="grid grid-cols-3 gap-3">
                      {generatedConcepts.map((concept, index) => (
                        <button
                          key={concept.id}
                          onClick={() => { setSelectedConcept(concept); applyConceptToForm(concept); }}
                          className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden h-32 ${selectedConcept?.id === concept.id ? 'bg-white border-[#a9b897] shadow-md' : 'bg-white/60 border-stone-100 hover:border-stone-200'}`}
                        >
                          <div className="text-[9px] font-mono text-stone-300">Idea 0{index + 1} // {concept.format}</div>
                          <div className="font-serif italic text-lg leading-tight mt-2 text-[#1c1c1c]">{concept.title}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Strategy Script Details */}
                {selectedConcept && (
                  <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-6">
                    <div className="flex justify-between items-start border-b border-stone-50 pb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/10 px-3 py-1 rounded-full">{selectedConcept.trendAngle}</span>
                        <h4 className="text-2xl font-serif italic mt-3">{selectedConcept.title}</h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-300">
                        <Film size={12}/> Creative Production Script
                      </div>
                      <div className="bg-stone-50 rounded-2xl p-6 text-xs font-medium text-stone-600 leading-relaxed whitespace-pre-wrap font-mono">
                        {metaScript}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-300">
                        <Music size={12}/> Recommended Sound & Trending Audio
                      </div>
                      <div className="bg-amber-50/40 border border-amber-100/50 rounded-xl p-4 flex items-center gap-3 text-xs font-semibold text-amber-900">
                        <Plus size={14} className="text-[#a9b897] shrink-0 animate-pulse"/>
                        <span>{metaAudio || "No background audio required for this format placement."}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Direct Posting / Scheduling Canvas */}
              <div className="col-span-12 lg:col-span-6">
                <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-2xl flex flex-col justify-between min-h-[600px]">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-300">Final Post Preview</label>
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">{format} Strategy</span>
                    </div>

                    {/* Integrated Media Upload Asset Dock */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-2">
                        <ImageIcon size={12}/> Asset Attachment
                      </label>
                      <div className="relative border border-dashed border-stone-200 rounded-2xl h-48 bg-stone-50/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-stone-50 group">
                        {mediaPreview ? (
                          <>
                            <img src={mediaPreview} alt="Upload Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                              className="absolute top-3 right-3 p-2 bg-[#1c1c1c] text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 p-6 w-full h-full">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 text-stone-400 group-hover:text-[#a9b897] transition-colors">
                              <Upload size={16} />
                            </div>
                            <span className="text-xs font-semibold text-stone-500">Drop your file or browse</span>
                            <span className="text-[9px] font-medium text-stone-300 uppercase tracking-wider">Supports images or video formats</span>
                            <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Main Caption Box */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Post Caption Copy</label>
                      <textarea 
                        value={caption} 
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full h-28 bg-stone-50 rounded-2xl p-5 text-base font-serif italic outline-none resize-none border border-stone-100 focus:border-[#a9b897] transition-all leading-relaxed"
                        placeholder="Write a custom post manually from scratch..."
                      />
                    </div>

                    {/* Search Optimizations */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-1.5"><Hash size={12}/> Search Optimization Tags</label>
                      <input 
                        value={hashtags} 
                        onChange={(e) => setHashtags(e.target.value)}
                        className="w-full p-4 bg-stone-50 rounded-xl text-xs font-mono font-bold outline-none border border-stone-100 focus:border-[#a9b897] transition-all"
                        placeholder="#branding #marketing"
                      />
                    </div>

                    {/* Targets and Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Target Platform</label>
                        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full p-4 bg-stone-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-stone-100">
                           <option value="instagram">Instagram</option>
                           <option value="tiktok">TikTok</option>
                           <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-stone-300 tracking-widest flex items-center gap-1.5"><Clock size={12}/> Publishing Schedule</label>
                        <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full p-4 bg-stone-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-stone-100" />
                      </div>
                    </div>
                  </div>

                  {/* Submission Action */}
                  <button onClick={deployToProductionGrid} disabled={isUploadingMedia} className="w-full py-6 mt-6 bg-[#1c1c1c] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-stone-800 transition-all shadow-xl shadow-stone-100">
                    {isUploadingMedia ? "Staging Assets..." : "Schedule Content Post"} <ArrowRight size={14} className="text-[#a9b897]"/>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            
            /* VIEW 2: FULL CONTENT PLANNER CALENDAR */
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

      {/* Day Overview Slide-out Drawer */}
      <AnimatePresence>
        {isDayViewOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDayViewOpen(false)} className="absolute inset-0 bg-stone-100/40 backdrop-blur-md" />
             <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-100 p-12 flex flex-col">
                <div className="flex justify-between items-center mb-12">
                   <h3 className="text-4xl font-serif italic">Daily Overview.</h3>
                   <button onClick={() => setIsDayViewOpen(false)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-4">
                  {selectedDayPosts.map((post) => (
                    <div key={post.id} className="bg-stone-50 rounded-[2.5rem] p-6 space-y-4 border border-stone-100 group">
                       <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl bg-[#1c1c1c]/5 flex items-center justify-center text-[#a9b897]">
                             {post.platform === 'instagram' ? <Instagram size={20}/> : post.platform === 'tiktok' ? <Video size={20}/> : <Linkedin size={20}/>}
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">{post.platform} // {post.format}</p>
                             <p className="text-sm font-serif italic text-stone-600 line-clamp-2 leading-snug mt-0.5">"{post.caption}"</p>
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
                  <Plus size={16}/> Add New Post
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}