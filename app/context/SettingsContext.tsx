"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export type SettingsState = {
  brandColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  mobileNav: string[] | null;
  organisationId: string | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
};

const defaultSettings: SettingsState = {
  brandColor: null,
  secondaryColor: null,
  fontFamily: null,
  logoUrl: null,
  mobileNav: null,
  organisationId: null,
  loading: true,
  refreshSettings: async () => {},
};

const SettingsContext = createContext<SettingsState>(defaultSettings);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState<string[] | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        console.log("No authenticated user yet - skipping settings load");
        setOrganisationId(null);
        setLoading(false);
        return;
      }

      const { data: p, error } = await supabase
        .from("profiles")
        .select("brand_color, secondary_color, font_family, logo_url, mobile_nav_config, organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", JSON.stringify(error, null, 2));
        return;
      }

      if (!p) {
        console.warn("No profile found for user:", user.id);
        return;
      }

      if (p.brand_color) setBrandColor(p.brand_color);
      if (p.secondary_color) setSecondaryColor(p.secondary_color);
      if (p.font_family) setFontFamily(p.font_family);
      if (p.logo_url) setLogoUrl(p.logo_url);
      if (p.mobile_nav_config) setMobileNav(p.mobile_nav_config as string[]);
      if (p.organisation_id) setOrganisationId(p.organisation_id);
    } catch (err) {
      console.error(
        "Error refreshing system settings:",
        JSON.stringify(err, null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshSettings();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: SettingsState = {
    brandColor,
    secondaryColor,
    fontFamily,
    logoUrl,
    mobileNav,
    organisationId,
    loading,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};