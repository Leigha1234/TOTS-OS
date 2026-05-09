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

  // Apply CSS variables to the document root whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--brand-primary", brandColor);
      root.style.setProperty("--brand-secondary", secondaryColor);
      root.style.setProperty("--font-family", `'${selectedFont}', sans-serif`);
      
      // Update body font directly to ensure priority
      document.body.style.fontFamily = `'${selectedFont}', sans-serif`;
    }
  }, [brandColor, secondaryColor, selectedFont]);

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
      {/* We keep the styled-jsx here as a backup layer, 
         but the useEffect above is what handles the global variable injection 
      */}
      <style jsx global>{`
        :root {
          --brand-primary: ${brandColor};
          --brand-secondary: ${secondaryColor};
        }
        body, html {
          font-family: var(--font-family) !important;
          background-color: ${isDarkMode ? '#0c0a09' : '#fcfaf7'};
          color: ${isDarkMode ? '#f5f5f4' : '#1c1917'};
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