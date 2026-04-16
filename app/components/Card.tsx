"use client";

import { motion } from "framer-motion";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut" 
      }}
      // Glassmorphism base styles + custom className
      className={`
        p-5 
        rounded-2xl 
        bg-white/5 
        backdrop-blur-md 
        border 
        border-white/10 
        shadow-xl 
        ${className}
      `.trim()}
    >
      {children}
    </motion.div>
  );
}