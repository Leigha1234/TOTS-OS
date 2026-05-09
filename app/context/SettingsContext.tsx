"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface SettingsState {
  brandColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string;
  mobileNav: string[];
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SettingsState = {
  brandColor: "#a9b897",
  secondaryColor: "#1c1917",
  fontFamily: "Inter",
  logoUrl: "",
  mobileNav: ["/dashboard", "/clarity", "/calendar"],
  loading: true,
  refreshSettings: async () => {}
};

const SettingsContext = createContext<SettingsState>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [brandColor, setBrandColor] = useState(defaultSettings.brandColor);
  const [secondaryColor, setSecondaryColor] = useState(defaultSettings.secondaryColor);
  const [fontFamily, setFontFamily] = useState(defaultSettings.fontFamily);
  const [logoUrl, setLogoUrl] = useState(defaultSettings.logoUrl);
  const [mobileNav, setMobileNav] = useState<string[]>(defaultSettings.mobileNav);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: p, error } = await supabase
        .from("profiles")
        .select("brand_color, secondary_color, font_family, logo_url, mobile_nav_config")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (p) {
        // Only update if values exist in DB, otherwise stay at defaults
        if (p.brand_color) setBrandColor(p.brand_color);
        if (p.secondary_color) setSecondaryColor(p.secondary_color);
        if (p.font_family) setFontFamily(p.font_family);
        if (p.logo_url) setLogoUrl(p.logo_url);
        if (p.mobile_nav_config) setMobileNav(p.mobile_nav_config);
      }
    } catch (err) {
      console.error("Error refreshing system settings:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial Sync on Mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // 🚀 GLOBAL STYLE INJECTION HANDSHAKE
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      
      // Inject CSS Variables into :root
      root.style.setProperty("--brand-primary", brandColor);
      root.style.setProperty("--brand-secondary", secondaryColor);
      
      // Inject Font Variable
      root.style.setProperty("--font-main", `'${fontFamily}', sans-serif`);
      
      // Apply Font and Theme Loaded State
      document.body.style.fontFamily = `var(--font-main)`;
      root.setAttribute("data-theme-loaded", "true");

      // Log for Debugging (Optional: remove in production)
      // console.log("🎨 Theme Injected:", { brandColor, fontFamily });
    }
  }, [brandColor, secondaryColor, fontFamily]);

  const value = useMemo(() => ({
    brandColor,
    secondaryColor,
    fontFamily,
    logoUrl,
    mobileNav,
    loading,
    refreshSettings
  }), [brandColor, secondaryColor, fontFamily, logoUrl, mobileNav, loading, refreshSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};