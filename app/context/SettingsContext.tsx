"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface SettingsState {
  brandColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string;
  mobileNav: string[];
  organisationId: string | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SettingsState = {
  brandColor: "#a9b897",
  secondaryColor: "#1c1917",
  fontFamily: "Inter",
  logoUrl: "",
  mobileNav: ["/dashboard", "/clarity", "/calendar"],
  organisationId: null,
  loading: true,
  refreshSettings: async () => {}
};

const SettingsContext = createContext<SettingsState>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize once outside or via useMemo to prevent re-creation
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [brandColor, setBrandColor] = useState(defaultSettings.brandColor);
  const [secondaryColor, setSecondaryColor] = useState(defaultSettings.secondaryColor);
  const [fontFamily, setFontFamily] = useState(defaultSettings.fontFamily);
  const [logoUrl, setLogoUrl] = useState(defaultSettings.logoUrl);
  const [mobileNav, setMobileNav] = useState<string[]>(defaultSettings.mobileNav);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    setLoading(true); // Ensure loading is true while fetching
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Reset to defaults if no user is found
        setOrganisationId(null);
        setLoading(false);
        return;
      }

      const { data: p, error } = await supabase
        .from("profiles")
        .select("brand_color, secondary_color, font_family, logo_url, mobile_nav_config, organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (p) {
        if (p.brand_color) setBrandColor(p.brand_color);
        if (p.secondary_color) setSecondaryColor(p.secondary_color);
        if (p.font_family) setFontFamily(p.font_family);
        if (p.logo_url) setLogoUrl(p.logo_url);
        if (p.mobile_nav_config) setMobileNav(p.mobile_nav_config);
        if (p.organisation_id) setOrganisationId(p.organisation_id);
      }
    } catch (err) {
      console.error("Error refreshing system settings:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Listen for Auth changes (Login/Logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        refreshSettings();
      }
      if (event === "SIGNED_OUT") {
        setOrganisationId(null);
        setLoading(false);
      }
    });

    refreshSettings();

    return () => subscription.unsubscribe();
  }, [supabase, refreshSettings]);

  // Inject CSS Variables
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--brand-primary", brandColor);
      root.style.setProperty("--brand-secondary", secondaryColor);
      
      // Clean font name for CSS
      const cleanFont = fontFamily.replace(/['"]/g, "");
      root.style.setProperty("--font-main", `'${cleanFont}', sans-serif`);
      
      document.body.style.fontFamily = `var(--font-main)`;
      root.setAttribute("data-theme-loaded", "true");
    }
  }, [brandColor, secondaryColor, fontFamily]);

  const value = useMemo(() => ({
    brandColor,
    secondaryColor,
    fontFamily,
    logoUrl,
    mobileNav,
    organisationId,
    loading,
    refreshSettings
  }), [brandColor, secondaryColor, fontFamily, logoUrl, mobileNav, organisationId, loading, refreshSettings]);

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