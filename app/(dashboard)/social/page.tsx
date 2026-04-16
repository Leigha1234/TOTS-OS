"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Layers, 
  Video, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  Trash2, 
  BarChart3, 
  Sparkles,
  Plus
} from "lucide-react";

interface ContentPost {
  type: "image" | "video" | "blog" | "carousel";
  caption: string;
  hashtags: string[];
  mentions: string[];
  location: string;
  platform: string;
  scheduled_for: string;
  status: "draft" | "scheduled";
  media_url?: string;
  excellence_score?: number;
  peak_time?: string;
}

const WEEKLY_LIMIT = 15;

export default function SocialLab() {
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentPost["type"]>("image");
  const [selectedPlatform] = useState("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<ContentPost[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);

  const contentTypes = [
    { id: "image", label: "Image", icon: ImageIcon, code: "IMG" },
    { id: "carousel", label: "Carousel", icon: Layers, code: "CRSL" },
    { id: "video", label: "Video", icon: Video, code: "MOV" },
    { id: "blog", label: "Blog", icon: FileText, code: "TXT" },
  ] as const;

  useEffect(() => {
    fetchWeeklyCount();
  }, []);

  const fetchWeeklyCount = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const { count } = await supabase
        .from("social_posts")
        .select("*", { count: 'exact', head: true })
        .gte("scheduled_for", startOfWeek);
      if (count !== null) setWeeklyCount(count);
    } catch (e) {
      console.error("Capacity check failed", e);
    }
  };

  const buildContent = async () => {
    if (!prompt) return;
    setIsGenerating(true);

    // Simulated AI Synthesis
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      const score = Math.floor(Math.random() * (98 - 85) + 85);
      
      const aiResponse: ContentPost = {
        type: contentType,
        platform: selectedPlatform,
        caption: `Clarity isn't about doing more; it's about being more intentional.\n\n${prompt} — We're implementing this shift at The Organised Types.\n\nHow does this change your workflow? 👇`,
        hashtags: ["#theorganisedtypes", "#clarityOS"],
        mentions: ["@TheOrganisedTypes"],
        location: "Clarity Headquarters",
        scheduled_for: "",
        status: "draft",
        media_url: `https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=800&sig=${randomId}`,
        excellence_score: score,
        peak_time: "06:45 PM"
      };

      setDrafts([aiResponse, ...drafts]);
      setIsGenerating(false);
      setPrompt("");
    }, 1500);
  };

  const schedulePost = async (index: number) => {
    const post = drafts[index];
    if (!post.scheduled_for) return alert("Please select a date.");

    const { error } = await supabase.from("social_posts").insert([{
      caption: post.caption,
      platform: post.platform,
      scheduled_for: post.scheduled_for,
      status: "scheduled",
      media_url: post.media_url
    }]);

    if (!error) {
      setDrafts(drafts.filter((_, i) => i !== index));
      fetchWeeklyCount();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-600">
              <Zap size={14} fill="currentColor" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Elite Tier Access</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter">Social Lab</h1>
            <p className="text-stone-400 italic font-serif text-lg">Distribution engine online. Synthesizing excellence.</p>
          </div>

          {/* CAPACITY GAUGE */}
          <div className="w-full md:w-72 space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Weekly Output</p>
              <p className="text-sm font-serif italic">{weeklyCount} / {WEEKLY_LIMIT}</p>
            </div>
            <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(weeklyCount / WEEKLY_LIMIT) * 100}%` }}
                className="h-full bg-purple-500"
              />
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* GENERATOR COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            
            <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100 space-y-10">
              <div className="flex flex-col gap-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Content Architecture</h2>
                <div className="flex flex-wrap gap-3">
                  {contentTypes.map((t) => (
                    <button 
                      key={t.id} 
                      onClick={() => setContentType(t.id)} 
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl border text-[10px] font-bold uppercase transition-all ${contentType === t.id ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-transparent border-stone-100 text-stone-400 hover:border-stone-200'}`}
                    >
                      <t.icon size={14} strokeWidth={contentType === t.id ? 3 : 2} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Input post intent or core message..."
                  className="w-full h-56 bg-stone-50 rounded-[2.5rem] p-10 text-2xl font-serif outline-none italic text-stone-800 placeholder-stone-200 resize-none transition-all focus:bg-white focus:shadow-inner border border-transparent focus:border-stone-100"
                />
                <div className="absolute top-8 right-10 flex items-center gap-2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-[9px] tracking-widest uppercase">Buffer Ready</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-3 hover:text-stone-900 transition-colors">
                  <Plus size={14} /> Attach Reference
                </button>
                <button
                  onClick={buildContent}
                  disabled={isGenerating || !prompt}
                  className="bg-purple-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-200 hover:bg-purple-700 disabled:opacity-20 transition-all flex items-center gap-3"
                >
                  {isGenerating ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Synthesizing</>
                  ) : (
                    <><Sparkles size={14} /> Generate Excellence</>
                  )}
                </button>
              </div>
            </section>

            {/* DRAFTS FEED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <AnimatePresence>
                {drafts.map((post, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-[#fffde7] p-8 rounded-lg shadow-xl flex flex-col gap-6 relative group"
                  >
                    <button 
                      onClick={() => setDrafts(drafts.filter((_, i) => i !== idx))}
                      className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="relative aspect-square rounded-sm overflow-hidden bg-white shadow-inner">
                      <img src={post.media_url} className="w-full h-full object-cover grayscale mix-blend-multiply opacity-70" />
                      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-2">
                         <BarChart3 size={10} /> SCORE: {post.excellence_score}%
                      </div>
                    </div>

                    <div className="space-y-3 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        {post.platform} // {post.type}
                      </p>
                      <p className="text-stone-900 font-serif text-lg leading-relaxed italic">
                        "{post.caption}"
                      </p>
                    </div>

                    <div className="pt-6 border-t border-black/5 space-y-4">
                      <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-black/5">
                        <Calendar size={14} className="text-stone-400" />
                        <input 
                          type="datetime-local" 
                          className="bg-transparent text-[10px] font-bold uppercase outline-none w-full" 
                          onChange={(e) => {
                            const updated = [...drafts];
                            updated[idx].scheduled_for = e.target.value;
                            setDrafts(updated);
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => schedulePost(idx)}
                        className="w-full bg-stone-900 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-2xl transition-all"
                      >
                        Pin to Horizon
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* SIDEBAR ANALYTICS */}
          <aside className="lg:col-span-4">
            <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl space-y-10 sticky top-12 border border-stone-800">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif italic text-purple-300">Resonance Engine</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500">Real-time Predictive Data</p>
              </div>

              <div className="space-y-8">
                {[
                  { label: "Est. Engagement", val: "+24.8%", trend: "OPTIMAL" },
                  { label: "Global Reach", val: "Elite", trend: "MAX" },
                  { label: "Peak Window", val: "18:45", trend: "LOCKED" },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-stone-800 pb-6 group">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 group-hover:text-purple-400 transition-colors">{m.label}</p>
                      <p className="text-4xl font-serif italic mt-1">{m.val}</p>
                    </div>
                    <span className="text-purple-400 text-[8px] font-mono mb-2 border border-purple-400/30 px-2 py-0.5 rounded uppercase">
                      {m.trend}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <p className="text-[10px] font-bold uppercase text-stone-500">Insight Node</p>
                <p className="text-sm font-serif italic text-stone-300 leading-relaxed">
                  "Video content synthesized between 12:00 and 14:00 today shows a 12% higher resonance probability based on recent node activity."
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}