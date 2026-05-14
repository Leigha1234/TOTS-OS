"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Minus, 
  Lock, 
  Cpu, 
  ShieldCheck,
  Maximize2
} from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS | THE HARDWARE ARCHIVE
 * --------------------------------------------------------------------------
 * Version: 10.0.1 (Stable - TypeScript Corrected)
 * Animation Profile: "Atmospheric Heavyweight"
 * * Technical Note: The luxEasing array is cast 'as const' to resolve 
 * the Type 'number[]' is not assignable to type 'Easing' error.
 * --------------------------------------------------------------------------
 */

export default function TeaserPage() {
  // Application State Management
  const [sequence, setSequence] = useState<"closed" | "open" | "shutting" | "final">("closed");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Configuration Constants
  // The 'as const' ensures TypeScript treats this as a fixed tuple [number, number, number, number]
  const luxEasing = [0.65, 0, 0.35, 1] as const;

  /**
   * Sequence Orchestration
   * Designed for maximum anticipation and brand weight.
   */
  useEffect(() => {
    // Stage 1: The laptop rests in the dark.
    // Stage 2: The lid hinges open, light spills out.
    const s1 = setTimeout(() => setSequence("open"), 1500);      
    
    // Stage 3: The screen stays active for a moment of brand recognition.
    const s2 = setTimeout(() => setSequence("shutting"), 5800);  
    
    // Stage 4: The hardware vanishes, the software access protocol begins.
    const s3 = setTimeout(() => setSequence("final"), 7200);     
    
    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Intentional delay to mimic "system processing" for the user.
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("SYSTEM ACCESS GRANTED: QUEUE POSITION SECURED");
    }, 2500);
  };

  return (
    <div className={`h-screen w-screen transition-colors duration-[2500ms] ease-in-out overflow-hidden font-sans relative ${
      sequence === "final" ? "bg-[#faf9f6]" : "bg-[#050505]"
    }`}>
      
      {/* --- VISUAL TEXTURE LAYER ---
          Adds organic depth via noise and soft-focus gradients.
      */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        
        {/* Dynamic Atmospheric Glow */}
        <motion.div 
          animate={{ 
            opacity: sequence === "final" ? 0.35 : 0.08,
            scale: sequence === "final" ? 1.3 : 1 
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#a9b897]/20 blur-[180px] rounded-full" 
        />
      </div>

      {/* --- STAGE 1 & 2: THE 3D HARDWARE SEQUENCE ---
          Simulating a physical MacBook reveal using CSS 3D transforms.
      */}
      <div className="relative h-full w-full flex items-center justify-center z-20 overflow-hidden">
        <AnimatePresence>
          {sequence !== "final" && (
            <motion.div 
              key="hardware-layer"
              exit={{ 
                y: -150, 
                opacity: 0, 
                scale: 0.8, 
                filter: "blur(40px)" 
              }}
              transition={{ duration: 1.8, ease: luxEasing }}
              className="flex flex-col items-center"
              style={{ perspective: "2000px" }}
            >
              {/* THE 3D LAPTOP BODY */}
              <div className="relative transform-gpu">
                
                {/* THE SCREEN (TOP LID) */}
                <motion.div 
                  initial={{ rotateX: -95 }}
                  animate={{ 
                    rotateX: sequence === "open" ? -5 : sequence === "shutting" ? -95 : -95 
                  }}
                  transition={{ duration: 2.2, ease: luxEasing }}
                  className="relative w-[300px] h-[200px] md:w-[620px] md:h-[410px] bg-stone-900 rounded-t-2xl border-[6px] border-stone-800/80 origin-bottom shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                  style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                >
                  {/* INNER DISPLAY PANEL */}
                  <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center p-12">
                    <motion.div 
                      initial={{ opacity: 0, filter: "blur(10px)" }}
                      animate={{ 
                        opacity: sequence === "open" ? 1 : 0,
                        filter: sequence === "open" ? "blur(0px)" : "blur(10px)"
                      }}
                      transition={{ delay: 1, duration: 1.5 }}
                      className="text-center space-y-8"
                    >
                       <div className="relative w-28 h-28 md:w-48 md:h-48 mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-[#111]">
                          <Image 
                            src="/images/TOTS-OS.jpeg" 
                            alt="TOTS OS" 
                            fill 
                            priority 
                            className="object-cover" 
                          />
                       </div>
                       <div className="space-y-4">
                          <h2 className="text-white font-serif italic text-2xl md:text-4xl tracking-tighter">
                            TOTS OS is <span className="text-[#a9b897]">Coming Soon</span>
                          </h2>
                          <motion.div 
                            animate={{ scaleX: [0, 1, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-16 h-[0.5px] bg-[#a9b897] mx-auto opacity-40" 
                          />
                       </div>
                    </motion.div>
                    
                    {/* Screen Refraction Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* THE KEYBOARD BASE */}
                <div className="w-[320px] h-[12px] md:w-[660px] md:h-[18px] bg-stone-800/90 rounded-b-xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative border-t border-white/5">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[2px] bg-stone-600 rounded-full opacity-30 mt-1" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 rounded-b-xl" />
                </div>
              </div>

              {/* STATUS INDICATORS */}
              <motion.div 
                animate={{ opacity: sequence === "open" ? 0.3 : 0 }}
                transition={{ duration: 1 }}
                className="mt-16 flex items-center gap-8 text-[#faf9f6]"
              >
                <div className="flex items-center gap-2">
                   <Cpu size={12} className="text-[#a9b897]" />
                   <span className="text-[8px] font-black uppercase tracking-[0.6em]">System Active</span>
                </div>
                <div className="flex items-center gap-2">
                   <Maximize2 size={12} />
                   <span className="text-[8px] font-black uppercase tracking-[0.6em]">Display: 4K High-Fi</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STAGE 3: THE FINAL PROTOCOL UI ---
            The clean, high-end waitlist that appears after the laptop shuts.
        */}
        <AnimatePresence>
          {sequence === "final" && (
            <motion.div
              initial={{ opacity: 0, y: 100, filter: "blur(20px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 2, ease: luxEasing }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
            >
              <div className="max-w-2xl w-full text-center space-y-20">
                
                {/* Brand Header */}
                <div className="space-y-8">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="w-14 h-14 rounded-full border border-[#a9b897]/40 flex items-center justify-center mx-auto bg-white shadow-sm"
                  >
                    <ShieldCheck size={20} className="text-[#a9b897]" />
                  </motion.div>
                  
                  <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-stone-900 leading-[0.85]">
                      Request <br /> <span className="text-[#a9b897]">Priority Access</span>
                    </h1>
                    <p className="text-[11px] uppercase tracking-[0.5em] font-bold text-stone-400 max-w-[380px] mx-auto leading-relaxed">
                      Enter the archive. Protocol seats for Release 01 are strictly limited.
                    </p>
                  </div>
                </div>

                {/* Secure Input Area */}
                <div className="max-w-md mx-auto w-full px-6">
                  {!isJoined ? (
                    <motion.form 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 1.5 }}
                      onSubmit={handleSubmit}
                      className="space-y-12"
                    >
                      <div className="relative group">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="IDENTITY KEY / EMAIL" 
                          className="w-full bg-transparent border-b-2 border-stone-100 py-6 text-center outline-none text-[11px] font-black tracking-[0.6em] text-stone-900 placeholder:text-stone-200 transition-all duration-1000 focus:border-[#a9b897] uppercase"
                          required
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#a9b897] transition-all duration-1000 group-focus-within:w-full" />
                      </div>
                      
                      <button 
                        disabled={isSubmitting}
                        className="w-full bg-stone-950 text-white py-7 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.7em] hover:bg-[#a9b897] hover:text-stone-950 transition-all duration-700 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 group disabled:opacity-40"
                      >
                        {isSubmitting ? (
                          <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                          <>
                            Submit Credentials <ArrowRight size={14} className="group-hover:translate-x-4 transition-transform duration-700" />
                          </>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-16 space-y-10"
                    >
                      <div className="relative inline-block">
                         <motion.div 
                           animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                           transition={{ duration: 3, repeat: Infinity }}
                           className="absolute inset-0 bg-[#a9b897] rounded-full blur-xl"
                         />
                         <CheckCircle2 size={48} className="text-[#a9b897] relative z-10 stroke-[1px]" />
                      </div>
                      <div className="space-y-4">
                        <p className="text-[14px] font-black uppercase tracking-[0.5em] text-stone-900 italic font-serif">Verified</p>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-loose max-w-[240px] mx-auto">
                          Awaiting synchronization with the next system release cycle.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* FOOTER: Global Navigation Placeholder */}
              <footer className="absolute bottom-16 w-full text-center space-y-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="space-y-4"
                >
                  {/* Placeholder content */}
                </motion.div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}