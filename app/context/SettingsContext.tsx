"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

// ============================================================
// TYPES
// ============================================================

export type SettingsState = {
  brandColor:
    string | null;

  secondaryColor:
    string | null;

  fontFamily:
    string | null;

  logoUrl:
    string | null;

  mobileNav:
    string[] | null;

  organisationId:
    string | null;

  loading:
    boolean;

  refreshSettings: () =>
    Promise<void>;
};

// ============================================================
// DEFAULTS
// ============================================================

const DEFAULT_MOBILE_NAV = [
  "/dashboard",
  "/projects",
  "/calendar",
];

const VALID_MOBILE_NAV_ROUTES =
  new Set([
    "/dashboard",
    "/calendar",
    "/crm",
    "/notes",
    "/campaigns",
    "/projects",
    "/social",
    "/payments",
    "/settings",
  ]);

// ============================================================
// HELPERS
// ============================================================

function normaliseMobileNav(
  value:
    unknown
): string[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return DEFAULT_MOBILE_NAV;
  }

  const cleaned =
    value
      .filter(
        (
          item
        ): item is string =>
          typeof item ===
          "string"
      )
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(
        (
          item
        ) =>
          VALID_MOBILE_NAV_ROUTES.has(
            item
          )
      );

  const unique =
    Array.from(
      new Set(
        cleaned
      )
    );

  if (
    unique.length !==
    3
  ) {
    return DEFAULT_MOBILE_NAV;
  }

  return unique;
}

// ============================================================
// CONTEXT DEFAULT
// ============================================================

const defaultSettings:
  SettingsState = {
  brandColor:
    null,

  secondaryColor:
    null,

  fontFamily:
    null,

  logoUrl:
    null,

  mobileNav:
    DEFAULT_MOBILE_NAV,

  organisationId:
    null,

  loading:
    true,

  refreshSettings:
    async () => {},
};

const SettingsContext =
  createContext<SettingsState>(
    defaultSettings
  );

// ============================================================
// PROVIDER
// ============================================================

export const SettingsProvider =
  ({
    children,
  }: {
    children:
      React.ReactNode;
  }) => {
    const [
      brandColor,
      setBrandColor,
    ] =
      useState<
        string | null
      >(
        null
      );

    const [
      secondaryColor,
      setSecondaryColor,
    ] =
      useState<
        string | null
      >(
        null
      );

    const [
      fontFamily,
      setFontFamily,
    ] =
      useState<
        string | null
      >(
        null
      );

    const [
      logoUrl,
      setLogoUrl,
    ] =
      useState<
        string | null
      >(
        null
      );

    const [
      mobileNav,
      setMobileNav,
    ] =
      useState<
        string[] | null
      >(
        DEFAULT_MOBILE_NAV
      );

    const [
      organisationId,
      setOrganisationId,
    ] =
      useState<
        string | null
      >(
        null
      );

    const [
      loading,
      setLoading,
    ] =
      useState<boolean>(
        true
      );

    // ========================================================
    // REFRESH SETTINGS
    // ========================================================

    const refreshSettings =
      async () => {
        try {
          const {
            data: {
              user,
            },

            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError
          ) {
            console.warn(
              "Auth state check failed (may be transient):",
              authError.message
            );

            setLoading(
              false
            );

            return;
          }

          if (
            !user?.id
          ) {
            console.log(
              "No authenticated user yet - skipping settings load"
            );

            setBrandColor(
              null
            );

            setSecondaryColor(
              null
            );

            setFontFamily(
              null
            );

            setLogoUrl(
              null
            );

            setMobileNav(
              DEFAULT_MOBILE_NAV
            );

            setOrganisationId(
              null
            );

            setLoading(
              false
            );

            return;
          }

          const {
            data:
              profile,

            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                `
                  brand_color,
                  secondary_color,
                  font_family,
                  logo_url,
                  mobile_nav_config,
                  organisation_id
                `
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.warn(
              "Profile fetch returned error (RLS or network):",
              profileError.message
            );

            setLoading(
              false
            );

            return;
          }

          if (
            !profile
          ) {
            console.warn(
              "No profile found for user:",
              user.id
            );

            setMobileNav(
              DEFAULT_MOBILE_NAV
            );

            setLoading(
              false
            );

            return;
          }

          // ==================================================
          // BRAND SETTINGS
          // ==================================================

          setBrandColor(
            profile.brand_color ||
              null
          );

          setSecondaryColor(
            profile.secondary_color ||
              null
          );

          setFontFamily(
            profile.font_family ||
              null
          );

          setLogoUrl(
            profile.logo_url ||
              null
          );

          // ==================================================
          // MOBILE NAV
          //
          // Old values such as "/clarity" are automatically
          // removed here. If the stored config is incomplete
          // or invalid, we fall back to the standard 3 tabs.
          // ==================================================

          setMobileNav(
            normaliseMobileNav(
              profile.mobile_nav_config
            )
          );

          // ==================================================
          // ORGANISATION
          // ==================================================

          setOrganisationId(
            profile.organisation_id ||
              null
          );
        } catch (
          error:
            unknown
        ) {
          console.warn(
            "Error refreshing system settings (non-blocking):",
            error instanceof
            Error
              ? error.message
              : "Unknown error"
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    // ========================================================
    // INITIAL LOAD + AUTH CHANGES
    // ========================================================

    useEffect(
      () => {
        void refreshSettings();

        const {
          data: {
            subscription,
          },
        } =
          supabase.auth.onAuthStateChange(
            () => {
              void refreshSettings();
            }
          );

        return () => {
          subscription.unsubscribe();
        };
      },
      []
    );

    // ========================================================
    // VALUE
    // ========================================================

    const value:
      SettingsState = {
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
      <SettingsContext.Provider
        value={
          value
        }
      >
        {
          children
        }
      </SettingsContext.Provider>
    );
  };

// ============================================================
// HOOK
// ============================================================

export const useSettings =
  () => {
    const context =
      useContext(
        SettingsContext
      );

    if (
      !context
    ) {
      throw new Error(
        "useSettings must be used within a SettingsProvider"
      );
    }

    return context;
  };