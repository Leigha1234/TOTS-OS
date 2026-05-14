"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: LUXE TEASER v3.0
 * ARCHITECTURE: VERTICAL PANE SLIDE (HERO -> ACCESS)
 */

export default function TeaserPage() {
  const [stage, setStage] = useState<"hero" | "access">("hero");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Auto-transition to Access pane after the initial logo reveal
  useEffect(() => {
    const timer = setTimeout(() => setStage("access"), 3200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("ACCESS GRANTED: WAITLIST SYNCHRONIZED");
    }, 2000);
  };

  return (
    <div className="h-screen w-screen bg-[#faf9f6] selection:bg-[#a9b897] selection:text-white overflow-hidden font-sans relative">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-px h-full bg-stone-200/40" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-stone-200/40" />
      </div>

      <motion.div 
        animate={{ y: stage === "hero" ? "0%" : "-100%" }}
        transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
        className="h-full w-full flex flex-col"
      >
        
        {/* --- PANE 1: THE HERO (LOGOTYPE) --- */}
        <section className="h-screen w-full shrink-0 flex flex-col items-center justify-center p-6 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="text-center space-y-12"
          >
            <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border-[0.5px] border-white/50 bg-white shadow-stone-200/50">
              <Image 
                src="/images/TOTS-OS.jpeg" 
                alt="TOTS OS" 
                fill 
                priority
                className="object-cover"
              />
            </div>
            
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="flex items-center justify-center gap-4 text-stone-300"
              >
                <Minus size={20} className="text-[#a9b897]" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em]">Establishing Protocol</span>
                <Minus size={20} className="text-[#a9b897]" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.5 }}
                className="text-4xl md:text-5xl font-serif italic tracking-tighter text-stone-900"
              >
                TOTS OS is <span className="text-[#a9b897]">Coming</span>
              </motion.h1>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-12 text-stone-300"
          >
            <div className="w-px h-12 bg-gradient-to-b from-stone-200 to-transparent mx-auto" />
          </motion.div>
        </section>

        {/* --- PANE 2: THE ACCESS (WAITLIST) --- */}
        <section className="h-screen w-full shrink-0 bg-[#faf9f6] flex flex-col items-center justify-center p-6 relative">
          <div className="max-w-xl w-full text-center space-y-16">
            
            <div className="space-y-6">
              <motion.div 
                animate={stage === "access" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="inline-block px-4 py-1.5 border border-[#a9b897]/20 rounded-full bg-white shadow-sm"
              >
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Priority Access List</span>
              </motion.div>
              
              <motion.h2 
                 animate={stage === "access" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                 transition={{ delay: 0.7, duration: 1 }}
                 className="text-5xl md:text-6xl font-serif italic tracking-tighter text-stone-900"
              >
                Secure your <br /> <span className="text-[#a9b897]">Digital Estate</span>
              </motion.h2>
              
              <motion.p 
                animate={stage === "access" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.9, duration: 1 }}
                className="text-[11px] uppercase tracking-[0.3em] font-bold text-stone-400 max-w-sm mx-auto leading-relaxed"
              >
                The operating system for the organized few. Reserved for those who demand high-fidelity efficiency.
              </motion.p>
            </div>

            <motion.div 
              animate={stage === "access" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 1.1, duration: 1 }}
              className="relative max-w-md mx-auto w-full px-4"
            >
              <AnimatePresence mode="wait">
                {!isJoined ? (
                  <motion.form 
                    key="form"
                    exit={{ opacity: 0, scale: 0.98 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                  >
                    <div className="relative group">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="IDENTIFICATION / EMAIL" 
                        className="w-full bg-white border-b-2 border-stone-200 py-6 px-4 outline-none text-[10px] font-bold tracking-[0.4em] text-stone-800 placeholder:text-stone-300 transition-all focus:border-[#a9b897] uppercase"
                        required
                      />
                    </div>
                    
                    <button 
                      disabled={isSubmitting}
                      className="w-full bg-stone-900 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] hover:bg-[#a9b897] hover:text-stone-900 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          Request Invite <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 flex flex-col items-center gap-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#a9b897]/10 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-[#a9b897]" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[12px] font-black uppercase tracking-[0.4em] text-stone-900">Protocol Accepted</p>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">You will be notified upon the next system cycle.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* FOOTER - ONLY IN SECOND PANE */}
          <footer className="absolute bottom-10 w-full text-center space-y-6">
            <div className="flex justify-center gap-10 opacity-30">
              <button className="text-[8px] font-black uppercase tracking-[0.4em] hover:text-[#a9b897] transition-colors">Instagram</button>
              <button className="text-[8px] font-black uppercase tracking-[0.4em] hover:text-[#a9b897] transition-colors">Internal</button>
            </div>
            <p className="text-[8px] font-black uppercase tracking-[1em] text-stone-300">
              TOTS OS © 2026
            </p>
          </footer>
        </section>

      </motion.div>
    </div>
  );
}