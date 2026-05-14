"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: PUBLIC TEASER v1.0.0
 * ROLE: ROOT LANDING & WAITING LIST ACQUISITION
 */

export default function TeaserPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay for the waiting list logic
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("Identity Logged: Welcome to the Waitlist");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 selection:bg-[#a9b897] selection:text-white overflow-hidden font-sans">
      
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a9b897]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#a9b897]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[600px] w-full text-center relative z-10">
        
        {/* LOGO SECTION */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-64 h-64 md:w-80 md:h-80 mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border border-white bg-white group"
          >
            <Image 
              src="/images/TOTS-OS.jpeg" 
              alt="TOTS OS Branding" 
              fill 
              priority
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        </motion.div>

        {/* COPY SECTION */}
        <div className="space-y-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles size={14} className="text-[#a9b897]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
              System Release: Coming 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-4xl md:text-5xl font-serif italic tracking-tighter text-stone-900 leading-tight"
          >
            TOTS OS is <span className="text-[#a9b897]">Establishing...</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-[11px] uppercase tracking-[0.2em] font-bold text-stone-400 max-w-[320px] mx-auto leading-relaxed"
          >
            The Operating System for The Organised Types. High-fidelity management for elite workflows.
          </motion.p>
        </div>

        {/* WAITING LIST FORM */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md mx-auto"
        >
          <AnimatePresence mode="wait">
            {!isJoined ? (
              <motion.form 
                key="form"
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="group relative"
              >
                <div className="flex bg-white border border-stone-200 p-2 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-500 group-focus-within:border-[#a9b897] group-focus-within:shadow-xl group-focus-within:shadow-[#a9b897]/10">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER EMAIL ACCESS..." 
                    className="flex-1 bg-transparent px-6 py-3 outline-none text-[10px] font-bold tracking-widest text-stone-800 placeholder:text-stone-300"
                    required
                  />
                  <button 
                    disabled={isSubmitting}
                    className="bg-stone-900 text-white px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] hover:text-stone-900 transition-all active:scale-95 flex items-center gap-2 min-w-[160px] justify-center"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        Join Waitlist <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-[#a9b897] p-4 rounded-full flex items-center justify-center gap-4 shadow-xl shadow-[#a9b897]/5"
              >
                <CheckCircle2 size={18} className="text-[#a9b897]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-800">
                  Priority Access Secured
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="mt-6 text-[8px] font-bold text-stone-300 uppercase tracking-[0.3em]">
            Limited Licenses Available Per Cycle
          </p>
        </motion.div>

      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-10 flex flex-col items-center gap-4">
        <div className="flex gap-8 opacity-30">
          <button className="text-[8px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">Instagram</button>
          <button className="text-[8px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">Protocols</button>
          <button className="text-[8px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">Direct</button>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-stone-300 mt-2">
          TOTS OS © 2026
        </p>
      </footer>

    </div>
  );
}