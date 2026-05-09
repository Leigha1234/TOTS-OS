"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  brandColor: string;
  setBrandColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandColor, setBrandColorState] = useState("#a9b897");
  const [secondaryColor, setSecondaryColorState] = useState("#e5e7eb");
  const [selectedFont, setSelectedFontState] = useState("Inter");
  const [isDarkMode, setIsDarkModeState] = useState(false);

  // 🧪 GLOBAL CSS VARIABLE INJECTION
  // This ensures that var(--brand-primary) works everywhere in your CSS files
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      
      root.style.setProperty("--brand-primary", brandColor);
      root.style.setProperty("--brand-secondary", secondaryColor);
      root.style.setProperty("--font-family", `'${selectedFont}', sans-serif`);
      
      // Update body classes for dark mode if needed
      if (isDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Force immediate body font update
      document.body.style.fontFamily = `'${selectedFont}', sans-serif`;
    }
  }, [brandColor, secondaryColor, selectedFont, isDarkMode]);

  // Load saved state from storage on mount
  useEffect(() => {
    const savedBrand = localStorage.getItem('app-brand-color');
    const savedSecondary = localStorage.getItem('app-secondary-color');
    const savedFont = localStorage.getItem('app-font-family');
    const savedTheme = localStorage.getItem('app-dark-mode');

    if (savedBrand) setBrandColorState(savedBrand);
    if (savedSecondary) setSecondaryColorState(savedSecondary);
    if (savedFont) setSelectedFontState(savedFont);
    if (savedTheme) setIsDarkModeState(savedTheme === 'true');
  }, []);

  const setBrandColor = (color: string) => {
    setBrandColorState(color);
    localStorage.setItem('app-brand-color', color);
  };

  const setSecondaryColor = (color: string) => {
    setSecondaryColorState(color);
    localStorage.setItem('app-secondary-color', color);
  };

  const setSelectedFont = (font: string) => {
    setSelectedFontState(font);
    localStorage.setItem('app-font-family', font);
  };

  const setIsDarkMode = (val: boolean) => {
    setIsDarkModeState(val);
    localStorage.setItem('app-dark-mode', String(val));
  };

  return (
    <ThemeContext.Provider value={{
      brandColor, setBrandColor,
      secondaryColor, setSecondaryColor,
      selectedFont, setSelectedFont,
      isDarkMode, setIsDarkMode
    }}>
      {/* We use styled-jsx as a secondary bridge to enforce high-priority styles */}
      <style jsx global>{`
        :root {
          --brand-primary: ${brandColor};
          --brand-secondary: ${secondaryColor};
        }
        body {
          font-family: '${selectedFont}', sans-serif !important;
          background-color: ${isDarkMode ? '#0c0a09' : '#fcfaf7'};
          color: ${isDarkMode ? '#f5f5f4' : '#1c1917'};
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .custom-brand-text {
          color: var(--brand-primary) !important;
        }
        .custom-brand-bg {
          background-color: var(--brand-primary) !important;
        }
        .custom-secondary-bg {
          background-color: var(--brand-secondary) !important;
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};