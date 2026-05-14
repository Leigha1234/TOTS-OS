"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: CINEMATIC TEASER v2.0
 * SEQUENCE: LOGO REVEAL -> SLIDE UP -> WAITLIST SHOWCASE
 */

export default function TeaserPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Automatically trigger the "slide up" after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowWaitlist(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("Identity Logged: Welcome to the Waitlist");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 selection:bg-[#a9b897] selection:text-white overflow-hidden font-sans relative">
      
      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ opacity: showWaitlist ? 1 : 0.4 }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a9b897]/5 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ opacity: showWaitlist ? 1 : 0.4 }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#a9b897]/5 blur-[120px] rounded-full" 
        />
      </div>

      <div className="w-full max-w-[600px] flex flex-col items-center relative z-10">
        
        {/* LOGO & TITLE SEQUENCE */}
        <motion.div 
          animate={{ 
            y: showWaitlist ? -40 : 0,
            scale: showWaitlist ? 0.85 : 1
          }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          {/* THE LOGO */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-64 h-64 md:w-80 md:h-80 mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border border-white bg-white mb-8"
          >
            <Image 
              src="/images/TOTS-OS.jpeg" 
              alt="TOTS OS Branding" 
              fill 
              priority
              className="object-cover"
            />
          </motion.div>

          {/* TEASER TEXT */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-serif italic tracking-tighter text-stone-900 leading-tight">
              TOTS OS is <span className="text-[#a9b897]">Coming</span>
            </h1>
            {!showWaitlist && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="text-[8px] font-black uppercase tracking-[0.6em] text-stone-500 animate-pulse"
              >
                Initializing Protocols...
              </motion.p>
            )}
          </motion.div>
        </motion.div>

        {/* WAITLIST SECTION (SLIDES UP) */}
        <AnimatePresence>
          {showWaitlist && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full mt-12 text-center"
            >
              <div className="space-y-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-[#a9b897]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">
                      Priority Access Protocol
                    </span>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-stone-400 max-w-[300px] leading-relaxed">
                    High-fidelity management for the organised few. Secure your spot in the first cycle.
                  </p>
                </div>

                <div className="max-w-md mx-auto w-full px-4">
                  {!isJoined ? (
                    <motion.form 
                      onSubmit={handleSubmit}
                      className="group relative"
                    >
                      <div className="flex bg-white border border-stone-200 p-2 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-500 focus-within:border-[#a9b897] focus-within:shadow-xl focus-within:shadow-[#a9b897]/10">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="EMAIL ACCESS KEY..." 
                          className="flex-1 bg-transparent px-6 py-3 outline-none text-[10px] font-bold tracking-widest text-stone-800 placeholder:text-stone-300 uppercase"
                          required
                        />
                        <button 
                          disabled={isSubmitting}
                          className="bg-stone-900 text-white px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] hover:text-stone-900 transition-all active:scale-95 flex items-center gap-2 min-w-[150px] justify-center shadow-lg"
                        >
                          {isSubmitting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              Join Now <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-stone-900 p-4 rounded-full flex items-center justify-center gap-4 shadow-2xl border border-[#a9b897]/20"
                    >
                      <CheckCircle2 size={18} className="text-[#a9b897]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        Priority Access Secured
                      </span>
                    </motion.div>
                  )}
                  
                  <p className="mt-8 text-[7px] font-black text-stone-300 uppercase tracking-[0.5em] italic">
                    Limited Licenses Remaining per temporal cycle
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-10 flex flex-col items-center gap-6">
        <motion.div 
          animate={{ opacity: showWaitlist ? 0.3 : 0 }}
          className="flex gap-8 transition-opacity duration-1000"
        >
          <button className="text-[8px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">Instagram</button>
          <button className="text-[8px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">Protocols</button>
          <button className="text-[8px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">Direct</button>
        </motion.div>
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-stone-300">
          TOTS OS © 2026
        </p>
      </footer>
    </div>
  );
}