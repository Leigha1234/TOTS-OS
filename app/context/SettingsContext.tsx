"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

// Define the shape of our settings for TypeScript
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

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  // We use useCallback so this function doesn't change on every render
  const refreshSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSettings(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data: p, error } = await supabase
        .from("profiles")
        .select("brand_color, secondary_color, font_family, logo_url, mobile_nav_config")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (p) {
        setSettings({
          brandColor: p.brand_color || "#a9b897",
          secondaryColor: p.secondary_color || "#1c1917",
          fontFamily: p.font_family || "Inter",
          logoUrl: p.logo_url || "",
          mobileNav: p.mobile_nav_config || ["/dashboard", "/clarity", "/calendar"],
          loading: false,
          refreshSettings // Keep the function in state
        });
      }
    } catch (err) {
      console.error("Error refreshing settings:", err);
      setSettings(prev => ({ ...prev, loading: false }));
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // SYSTEM-WIDE INJECTION
  // This is the "Magic" that makes colors and fonts update everywhere instantly
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      
      // 1. Inject Colors into CSS Variables
      root.style.setProperty("--brand-primary", settings.brandColor);
      root.style.setProperty("--brand-secondary", settings.secondaryColor);
      
      // 2. Inject Font into Body
      document.body.style.fontFamily = settings.fontFamily;
      
      // 3. Optional: Update Favicon or Title if needed
      // console.log("System Styles Synced:", settings.brandColor);
    }
  }, [settings.brandColor, settings.secondaryColor, settings.fontFamily]);

  return (
    <SettingsContext.Provider value={settings}>
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