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
      <style jsx global>{`
        body, html {
          font-family: '${selectedFont}', sans-serif !important;
        }
        .custom-brand-text {
          color: ${brandColor} !important;
        }
        .custom-brand-bg {
          background-color: ${brandColor} !important;
        }
        .custom-secondary-bg {
          background-color: ${secondaryColor} !important;
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