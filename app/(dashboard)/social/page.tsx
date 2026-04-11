"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Using a local Page wrapper to avoid import errors
function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#faf9f6]">{children}</div>;
}

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

export default function SocialLab() {
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentPost["type"]>("image");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<ContentPost[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);

  const WEEKLY_LIMIT = 15;
  
  const contentTypes = [
    { id: "image", label: "Single Image", code: "IMG" },
    { id: "carousel", label: "Carousel", code: "CRSL" },
    { id: "video", label: "Video/Reel", code: "MOV" },
    { id: "blog", label: "Blog Post", code: "TXT" },
  ] as const;

  useEffect(() => {
    fetchWeeklyCount();
  }, []);

  const fetchWeeklyCount = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const { count, error } = await supabase
        .from("social_posts")
        .select("*", { count: 'exact', head: true })
        .gte("scheduled_for", startOfWeek);
      if (!error && count !== null) setWeeklyCount(count);
    } catch (e) {
      console.error("Capacity check failed", e);
    }
  };

  const getPredictiveData = () => {
    const score = Math.floor(Math.random() * (98 - 85) + 85);
    const times = ["08:15 AM", "12:30 PM", "06:45 PM", "09:00 AM"];
    return {
      score,
      time: times[Math.floor(Math.random() * times.length)]
    };
  };

  const expandWithClarity = (input: string) => {
    const hooks = [
      "Clarity isn't about doing more; it's about being more intentional.",
      "The best systems are the ones that disappear so you can focus on the work.",
      "Efficiency is the byproduct of a clear mind."
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    return `${hook}\n\n${input} — We're implementing this shift at The Organised Types to ensure we move the needle daily.\n\nHow does this change your workflow? 👇`;
  };

  const buildContent = async () => {
    if (!prompt) return;
    setIsGenerating(true);

    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      const analytics = getPredictiveData();
      
      const aiResponse: ContentPost = {
        type: contentType,
        platform: selectedPlatform,
        caption: expandWithClarity(prompt),
        hashtags: ["#theorganisedtypes", "#clarityOS"],
        mentions: ["@TheOrganisedTypes"],
        location: "Clarity Headquarters",
        scheduled_for: "",
        status: "draft",
        media_url: `https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800&sig=${randomId}`,
        excellence_score: analytics.score,
        peak_time: analytics.time
      };

      setDrafts([aiResponse, ...drafts]);
      setIsGenerating(false);
      setPrompt("");
    }, 1500);
  };

  const updateDraft = (index: number, key: keyof ContentPost, value: any) => {
    const updated = [...drafts];
    (updated[index] as any)[key] = value;
    setDrafts(updated);
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

    if (error) {
      alert(error.message);
    } else {
      setDrafts(drafts.filter((_, i) => i !== index));
      fetchWeeklyCount();
      alert("Post excellence pinned to schedule.");
    }
  };

  return (
    <PageWrapper>
      <div className="p-8 md:p-12">
        <div className="max-w-[1400px] mx-auto space-y-12">
          
          <header className="flex justify-between items-start">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Elite Tier Node
              </p>
              <h1 className="text-7xl font-serif italic text-stone-800 tracking-tighter leading-tight">Social Lab</h1>
              <p className="text-stone-400 font-medium max-w-md italic font-serif">Distribution engine online. Manage the grid.</p>
            </div>
          </header>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              
              {/* CAPACITY */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm gap-6">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-stone-900 rounded-lg text-[10px] font-mono text-white tracking-widest">CAP</div>
                  <div>
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">System Capacity</h3>
                    <p className="text-lg font-serif italic text-stone-800">{weeklyCount} / {WEEKLY_LIMIT} Weekly Posts</p>
                  </div>
                </div>
                <div className="flex-1 w-full max-w-md h-1.5 bg-stone-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(weeklyCount / WEEKLY_LIMIT) * 100}%` }}
                    className="h-full bg-purple-400"
                  />
                </div>
              </div>

              {/* ENGINE */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-stone-100">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
                  <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Format</h2>
                    <div className="flex flex-wrap gap-2">
                      {contentTypes.map((t) => (
                        <button key={t.id} onClick={() => setContentType(t.id as any)} className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${contentType === t.id ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-100 text-stone-400'}`}>
                          <span className="opacity-50 font-mono text-[8px]">{t.code}</span> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the post intent..."
                    className="w-full h-44 bg-stone-50 rounded-[2rem] p-8 text-2xl font-serif outline-none italic text-stone-800 placeholder-stone-200 resize-none shadow-inner"
                  />
                  <div className="absolute top-8 right-8 text-stone-200 font-mono text-[10px] tracking-widest">[INPUT_READY]</div>
                </div>

                <div className="mt-10 flex items-center justify-between">
                  <button className="text-stone-400 hover:text-stone-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    Attach Asset Reference
                  </button>
                  <button
                    onClick={buildContent}
                    disabled={isGenerating || !prompt}
                    className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-purple-700 disabled:opacity-30 transition-all"
                  >
                    {isGenerating ? "Synthesizing..." : "Generate Excellence"}
                  </button>
                </div>
              </div>

              {/* DRAFTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {drafts.map((post, idx) => (
                    <motion.div 
                      key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-[#fff9c4] p-8 shadow-xl relative flex flex-col min-h-[500px] rounded-sm"
                    >
                      <button onClick={() => setDrafts(drafts.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-stone-400 hover:text-red-500 font-black text-[9px]">
                        [ REMOVE ]
                      </button>
                      
                      <div className="w-full aspect-square bg-white rounded-sm mb-6 overflow-hidden relative">
                        <img src={post.media_url} alt="Ref" className="w-full h-full object-cover grayscale mix-blend-multiply opacity-80" />
                        <div className="absolute bottom-3 left-3 flex gap-2">
                           <div className="bg-white/90 px-2 py-1 rounded-full text-[9px] font-black flex items-center gap-1">
                              RANK: {post.excellence_score}%
                           </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <span className="text-[9px] font-black text-stone-400 uppercase">{post.platform} // {post.type}</span>
                        <p className="text-stone-900 font-serif text-lg leading-relaxed italic mt-2">"{post.caption}"</p>
                      </div>

                      <div className="mt-6 pt-6 border-t border-black/5 space-y-4">
                        <input type="datetime-local" className="w-full bg-black/5 rounded p-3 text-[10px] font-bold text-stone-800 outline-none" onChange={(e) => updateDraft(idx, "scheduled_for", e.target.value)} />
                        <button onClick={() => schedulePost(idx)} className="w-full bg-stone-900 text-white py-3 rounded-sm text-[9px] font-black uppercase tracking-[0.2em]">
                          Pin to Horizon
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* RESONANCE ENGINE */}
            <div className="lg:col-span-4">
              <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8 sticky top-12">
                <h2 className="text-2xl font-serif italic text-purple-300">Resonance Engine</h2>
                <div className="space-y-6">
                  {[
                    { label: "Engagement Rate", val: "+24.8%", trend: "UP" },
                    { label: "Predictive Score", val: "92/100", trend: "STABLE" },
                  ].map((m, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-stone-800 pb-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">{m.label}</p>
                        <p className="text-3xl font-serif italic">{m.val}</p>
                      </div>
                      <span className="text-purple-400 text-[8px] font-mono mb-2">[{m.trend}]</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageWrapper>
  );
}