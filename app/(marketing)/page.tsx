"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: LUXURY REVEAL v4.0
 * ANIMATION: LOGO ENTRANCE -> VERTICAL PANE SHIFT -> INTERACTIVE ACCESS
 */

export default function TeaserPage() {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Trigger the "Lux Slide" after the initial logo reveal
  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("SYSTEM ACCESS: WAITLIST CONFIRMED");
    }, 2000);
  };

  return (
    <div className="h-screen w-screen bg-stone-950 selection:bg-[#a9b897] selection:text-white overflow-hidden font-sans relative">
      
      {/* BACKGROUND TEXTURE */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-px h-full bg-white/10" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-white/10" />
      </div>

      <motion.div 
        animate={{ y: hasLoaded ? "-100%" : "0%" }}
        transition={{ duration: 1.8, ease: [0.85, 0, 0.15, 1] }}
        className="h-full w-full flex flex-col"
      >
        
        {/* --- STAGE 1: CINEMATIC LOGO REVEAL --- */}
        <section className="h-screen w-full shrink-0 flex flex-col items-center justify-center p-6 bg-stone-950">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-16"
          >
            {/* LARGE LOGO HERO */}
            <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] mx-auto rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(169,184,151,0.15)] border border-white/5">
              <Image 
                src="/images/TOTS-OS.jpeg" 
                alt="TOTS OS" 
                fill 
                priority
                className="object-cover"
              />
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter text-stone-100">
                TOTS OS is <span className="text-[#a9b897]">Coming</span>
              </h1>
              <div className="w-12 h-px bg-[#a9b897] mx-auto opacity-50" />
            </motion.div>
          </motion.div>
        </section>

        {/* --- STAGE 2: LUXURY WAITING LIST --- */}
        <section className="h-screen w-full shrink-0 bg-[#faf9f6] flex flex-col items-center justify-center p-6 relative">
          <div className="max-w-xl w-full text-center space-y-12">
            
            <motion.div 
              animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ delay: 0.8, duration: 1.2 }}
              className="space-y-6"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#a9b897] block">
                The Organised Types
              </span>
              
              <h2 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-stone-900 leading-[0.9]">
                Secure Your <br /> <span className="text-[#a9b897]">Digital License</span>
              </h2>
              
              <p className="text-[11px] uppercase tracking-[0.4em] font-bold text-stone-400 max-w-sm mx-auto leading-relaxed">
                Elevating high-fidelity management for the elite workflow. Limited allocation per release.
              </p>
            </motion.div>

            <motion.div 
              animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ delay: 1.2, duration: 1.2 }}
              className="max-w-md mx-auto w-full px-4"
            >
              <AnimatePresence mode="wait">
                {!isJoined ? (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-8"
                  >
                    <div className="relative">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="IDENTIFICATION KEY" 
                        className="w-full bg-transparent border-b border-stone-200 py-6 text-center outline-none text-[10px] font-bold tracking-[0.5em] text-stone-900 placeholder:text-stone-300 transition-all focus:border-[#a9b897] uppercase"
                        required
                      />
                    </div>
                    
                    <button 
                      disabled={isSubmitting}
                      className="w-full bg-stone-900 text-white py-6 rounded-full text-[10px] font-black uppercase tracking-[0.6em] hover:bg-[#a9b897] hover:text-stone-950 transition-all duration-500 shadow-2xl flex items-center justify-center gap-4 group active:scale-95"
                    >
                      {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin text-white" />
                      ) : (
                        <>
                          Apply for Access <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 flex flex-col items-center gap-8"
                  >
                    <div className="w-20 h-20 rounded-full border border-[#a9b897] flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-[#a9b897] stroke-[1px]" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-900">Application Logged</p>
                      <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Awaiting system verification for the next release cycle.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* MINIMAL FOOTER */}
          <footer className="absolute bottom-12 w-full text-center">
            <div className="flex justify-center gap-12 mb-8 opacity-20 hover:opacity-50 transition-opacity duration-500">
              <button className="text-[8px] font-black uppercase tracking-[0.4em]">Instagram</button>
              <button className="text-[8px] font-black uppercase tracking-[0.4em]">Protocol</button>
            </div>
            <p className="text-[8px] font-black uppercase tracking-[1.2em] text-stone-300">
              TOTS OS © MMXXVI
            </p>
          </footer>
        </section>

      </motion.div>
    </div>
  );
}