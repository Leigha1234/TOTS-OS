"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: LUXE REVEAL v5.0
 * CONCEPT: THE "ARCHIVE" OPENING
 */

export default function TeaserPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Stage 1: Initial breath (Logo scale)
    // Stage 2: The Reveal (Slide up)
    const timer = setTimeout(() => setHasStarted(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("Identity Logged: Welcome to the Waitlist");
    }, 2000);
  };

  return (
    <div className="h-screen w-screen bg-[#faf9f6] selection:bg-[#a9b897] selection:text-white overflow-hidden font-sans relative">
      
      {/* CINEMATIC LAYERING: LIGHT & TEXTURE */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <motion.div 
          animate={{ 
            opacity: hasStarted ? 0.4 : 0.1,
            scale: hasStarted ? 1.2 : 1 
          }}
          transition={{ duration: 3 }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#a9b897]/10 blur-[140px] rounded-full" 
        />
      </div>

      <motion.div 
        animate={{ y: hasStarted ? "-40vh" : "0vh" }}
        transition={{ duration: 2, ease: [0.85, 0, 0.15, 1] }}
        className="h-full w-full flex flex-col items-center justify-center relative z-20"
      >
        
        {/* --- THE LOGO CORE --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="relative group"
        >
          <motion.div 
            animate={{ 
                boxShadow: hasStarted 
                    ? "0 20px 50px rgba(0,0,0,0.05)" 
                    : "0 60px 100px rgba(0,0,0,0.12)"
            }}
            className="relative w-64 h-64 md:w-96 md:h-96 rounded-[3rem] overflow-hidden border border-white bg-white shadow-stone-200/50 transition-all duration-1000"
          >
            <Image 
              src="/images/TOTS-OS.jpeg" 
              alt="TOTS OS" 
              fill 
              priority
              className="object-cover"
            />
          </motion.div>

          {/* TEASER TEXT - ELEGANT REVEAL */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="mt-12 text-center"
          >
            <h1 className="text-3xl md:text-5xl font-serif italic tracking-tighter text-stone-900 leading-none">
              TOTS OS is <span className="text-[#a9b897]">Coming</span>
            </h1>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "60px" }}
              transition={{ delay: 1.5, duration: 1 }}
              className="h-[1px] bg-[#a9b897] mx-auto mt-6 opacity-40" 
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* --- THE ACCESS PANEL: SLIDING FROM BOTTOM --- */}
      <motion.div
        initial={{ opacity: 0, y: "100vh" }}
        animate={{ opacity: hasStarted ? 1 : 0, y: hasStarted ? "50vh" : "100vh" }}
        transition={{ duration: 2, ease: [0.85, 0, 0.15, 1] }}
        className="fixed inset-0 h-[50vh] w-full bg-white/40 backdrop-blur-3xl border-t border-white/50 z-30 flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-md w-full space-y-10 text-center">
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-[#a9b897]">
              Priority Release Protocol
            </span>
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-stone-400 max-w-[280px] mx-auto leading-relaxed">
              Reserved for high-fidelity efficiency. Secure your place in the first cycle.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isJoined ? (
              <motion.form 
                key="form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="relative border-b border-stone-200 focus-within:border-[#a9b897] transition-all duration-500">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ACCESS ID / EMAIL" 
                    className="w-full bg-transparent py-4 text-center outline-none text-[10px] font-bold tracking-[0.5em] text-stone-800 placeholder:text-stone-300 uppercase"
                    required
                  />
                </div>
                
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-stone-900 text-white py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#a9b897] hover:text-stone-950 transition-all duration-700 shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      Request Entry <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <CheckCircle2 size={24} className="text-[#a9b897] stroke-[1px]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-900">
                  Identity Logged: Awaiting Sync
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FOOTER DETAILS */}
          <div className="pt-12 flex flex-col items-center gap-6 opacity-20 hover:opacity-50 transition-opacity duration-700">
            <div className="flex gap-10">
              <button className="text-[7px] font-black uppercase tracking-widest">Instagram</button>
              <button className="text-[7px] font-black uppercase tracking-widest">Archive</button>
            </div>
            <p className="text-[7px] font-black uppercase tracking-[1em] text-stone-400">
              TOTS OS © 2026
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}