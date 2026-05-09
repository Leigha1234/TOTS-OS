"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// 1. Create a default state so it's never null
const defaultSettings = {
  brandColor: "#a9b897",
  secondaryColor: "#1c1917",
  fontFamily: "Inter",
  logoUrl: "",
  mobileNav: ["/dashboard", "/clarity", "/calendar"],
  loading: true,
  refreshSettings: async () => {}
};

const SettingsContext = createContext(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [settings, setSettings] = useState(defaultSettings);

  const refreshSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: p } = await supabase
      .from("profiles")
      .select("brand_color, secondary_color, font_family, logo_url, mobile_nav_config")
      .eq("id", user.id)
      .maybeSingle();

    if (p) {
      setSettings({
        brandColor: p.brand_color || "#a9b897",
        secondaryColor: p.secondary_color || "#1c1917",
        fontFamily: p.font_family || "Inter",
        logoUrl: p.logo_url || "",
        mobileNav: p.mobile_nav_config || ["/dashboard", "/clarity", "/calendar"],
        loading: false,
        refreshSettings
      });
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty("--brand-primary", settings.brandColor);
      document.documentElement.style.setProperty("--brand-secondary", settings.secondaryColor);
    }
  }, [settings.brandColor, settings.secondaryColor]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

// 2. Add a safety check in the hook
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    return defaultSettings; // Fallback to defaults instead of crashing
  }
  return context;
};