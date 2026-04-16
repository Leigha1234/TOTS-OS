"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * TopLoader provides a subtle visual cue during page transitions.
 * Styled to match the TOTS OS aesthetic with a green accent and glow.
 */
export default function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start loading sequence
    setLoading(true);
    setVisible(true);

    const timer = setTimeout(() => {
      setLoading(false);
      // Keep visible for a moment to allow the 100% width transition to finish
      const fadeTimer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(fadeTimer);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 h-[2px] z-[9999] pointer-events-none transition-all duration-500 ease-out ${
        loading ? "w-1/2 opacity-100" : "w-full opacity-0"
      }`}
      style={{
        backgroundColor: "#a9b897",
        boxShadow: "0 0 10px #a9b897, 0 0 5px #a9b897",
      }}
    />
  );
}