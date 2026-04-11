"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <button 
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--text)]"
    >
      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}