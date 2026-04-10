"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 left-0 h-[2px] bg-blue-500 transition-all duration-300 z-[9999] ${
        loading ? "w-full opacity-100" : "w-0 opacity-0"
      }`}
    />
  );
}