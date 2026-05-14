"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Minus, Laptop, Lock } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS | THE HARDWARE REVEAL
 * Version: 9.0.0 (Cinematic 3D Laptop Sequence)
 * Flow: Laptop Opens -> Teaser -> Laptop Closes -> Waitlist Reveal
 */

export default function TeaserPage() {
  const [sequence, setSequence] = useState<"closed" | "open" | "shutting" | "final">("closed");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Cinematic Timeline
  useEffect(() => {
    const s1 = setTimeout(() => setSequence("open"), 1200);      // Open Lid
    const s2 = setTimeout(() => setSequence("shutting"), 5500);  // Close Lid
    const s3 = setTimeout(() => setSequence("final"), 6800);     // Transition UI
    
    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("SYSTEM ACCESS GRANTED");
    }, 2000);
  };

  const luxEasing = [0.65, 0, 0.35, 1];

  return (
    <div className={`h-screen w-screen transition-colors duration-[2000ms] ease-in-out overflow-hidden font-sans relative ${
      sequence === "final" ? "bg-[#faf9f6]" : "bg-[#080808]"
    }`}>
      
      {/* NOISE & AMBIENCE */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        <motion.div 
          animate={{ opacity: sequence === "final" ? 0.4 : 0.1 }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#a9b897]/20 blur-[150px] rounded-full" 
        />
      </div>

      {/* --- STAGE 1 & 2: THE 3D LAPTOP ANIMATION --- */}
      <div className="relative h-full w-full flex items-center justify-center z-20 overflow-hidden">
        <AnimatePresence>
          {sequence !== "final" && (
            <motion.div 
              exit={{ y: -100, opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              transition={{ duration: 1.5, ease: luxEasing }}
              className="perspective-[2000px] flex flex-col items-center"
            >
              {/* THE LAPTOP CONTAINER */}
              <div className="relative transform-gpu transition-transform duration-1000">
                
                {/* THE SCREEN (LID) */}
                <motion.div 
                  initial={{ rotateX: -95 }}
                  animate={{ 
                    rotateX: sequence === "open" ? -5 : sequence === "shutting" ? -95 : -95 
                  }}
                  transition={{ duration: 1.8, ease: luxEasing }}
                  className="relative w-[320px] h-[210px] md:w-[600px] md:h-[400px] bg-stone-900 rounded-t-2xl border-[6px] border-stone-800 origin-bottom shadow-2xl overflow-hidden preserve-3d"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* INNER SCREEN CONTENT */}
                  <div className="absolute inset-0 bg-black flex items-center justify-center p-8">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: sequence === "open" ? 1 : 0 }}
                      transition={{ delay: 0.8 }}
                      className="text-center space-y-6"
                    >
                       <div className="relative w-24 h-24 md:w-40 md:h-40 mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                          <Image src="/images/TOTS-OS.jpeg" alt="TOTS" fill className="object-cover" />
                       </div>
                       <h2 className="text-white font-serif italic text-xl md:text-3xl tracking-tighter">
                         TOTS OS is <span className="text-[#a9b897]">Coming Soon</span>
                       </h2>
                       <div className="w-8 h-px bg-[#a9b897]/50 mx-auto" />
                    </motion.div>
                    
                    {/* Screen Glare */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* THE BASE (KEYBOARD AREA) */}
                <div className="w-[340px] h-[10px] md:w-[640px] md:h-[15px] bg-stone-800 rounded-b-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-stone-700 rounded-full opacity-50" />
                </div>
              </div>

              {/* ATMOSPHERIC TEXT BELOW LAPTOP */}
              <motion.div 
                animate={{ opacity: sequence === "open" ? 0.3 : 0 }}
                className="mt-12 text-[#faf9f6] flex items-center gap-4"
              >
                <Minus size={20} className="opacity-20" />
                <span className="text-[9px] font-black uppercase tracking-[0.8em]">Initializing Hardware</span>
                <Minus size={20} className="opacity-20" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STAGE 3: THE WAITLIST REVEAL --- */}
        <AnimatePresence>
          {sequence === "final" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: luxEasing }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              <div className="max-w-xl w-full text-center space-y-12">
                
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-16 h-16 rounded-full border border-[#a9b897]/30 flex items-center justify-center mx-auto bg-white shadow-sm"
                  >
                    <Lock size={18} className="text-[#a9b897]" />
                  </motion.div>
                  <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-stone-900 leading-[0.9]">
                    Join the <br /> <span className="text-[#a9b897]">Waiting List</span>
                  </h1>
                  <p className="text-[11px] uppercase tracking-[0.4em] font-bold text-stone-400 max-w-[320px] mx-auto leading-relaxed">
                    Exclusively curated for high-fidelity efficiency. Secure your protocol seat.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full px-4">
                  {!isJoined ? (
                    <motion.form 
                      onSubmit={handleSubmit}
                      className="space-y-10"
                    >
                      <div className="relative group border-b border-stone-200 focus-within:border-[#a9b897] transition-all duration-700">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="IDENTIFICATION / EMAIL" 
                          className="w-full bg-transparent py-6 text-center outline-none text-[10px] font-black tracking-[0.6em] text-stone-900 placeholder:text-stone-200 uppercase"
                          required
                        />
                      </div>
                      
                      <button 
                        disabled={isSubmitting}
                        className="w-full bg-stone-950 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.6em] hover:bg-[#a9b897] hover:text-stone-950 transition-all duration-700 shadow-2xl flex items-center justify-center gap-4 group disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 size={16} className="animate-spin text-white" />
                        ) : (
                          <>
                            Request Invite <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 space-y-6"
                    >
                      <CheckCircle2 size={40} className="text-[#a9b897] mx-auto stroke-[1px]" />
                      <div className="space-y-2">
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-900">Credentials Logged</p>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Awaiting system verification.</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <footer className="absolute bottom-12 w-full text-center opacity-20 hover:opacity-50 transition-opacity duration-700">
                <div className="flex justify-center gap-12 mb-8">
                  <button className="text-[8px] font-black uppercase tracking-[0.5em]">Instagram</button>
                  <button className="text-[8px] font-black uppercase tracking-[0.5em]">System</button>
                </div>
                <p className="text-[8px] font-black uppercase tracking-[1.5em] text-stone-400">
                  TOTS OS © 2026
                </p>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* CSS For 3D Perspective */}
      <style jsx global>{`
        .perspective-2000 { perspective: 2000px; }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
}