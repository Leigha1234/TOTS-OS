"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const SettingsContext = createContext<any>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [settings, setSettings] = useState({
    brandColor: "#a9b897",
    secondaryColor: "#1c1917",
    fontFamily: "Inter",
    logoUrl: "",
    mobileNav: ["/dashboard", "/clarity", "/calendar"],
    loading: true
  });

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
        loading: false
      });
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Update CSS Variables globally whenever colors or fonts change
  useEffect(() => {
    document.documentElement.style.setProperty("--brand-primary", settings.brandColor);
    document.documentElement.style.setProperty("--brand-secondary", settings.secondaryColor);
    document.body.style.fontFamily = settings.fontFamily;
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ ...settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);