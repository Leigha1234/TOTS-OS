"use client";

import { motion } from "framer-motion";

export default function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string; // Added this
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // Combining base styles with the incoming className
      className={`p-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
}