"use client";

export const dynamic = "force-dynamic";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import LegalHub from "@/app/components/LegalHub";
import PasswordSection from "@/app/components/PasswordSection";

import ConnectedAccountModal from "./components/ConnectedAccountModal";
import ProfileSettings from "./components/ProfileSettings";
import SettingsHeader from "./components/SettingsHeader";
import SocialSettings from "./components/SocialSettings";

import { useSettingsProfile } from "./hooks/useSettingsProfile";
import { useSocialConnections } from "./hooks/useSocialConnections";
import { useTikTokOAuthResult } from "./hooks/useTikTokOAuthResult";

import { supabase } from "../../../lib/supabase";

// ==================================================
// TYPES
// ==================================================

type OAuthState = {
  platform?: string;
  userId?: string;
};

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string | null;
  expires_at?: string | null;
};

// ==================================================
// CONSTANTS
// ==================================================

const LOGO_STORAGE_KEY = "tots_os_profile_logo_url";

// ==================================================
// HELPERS
// ==================================================

function getOAuthStorageKey(
  platform: string
) {
  return platform === "meta"
    ? "oauth_pending_meta"
    : `oauth_pending_${platform}`;
}

function getStoredLogoUrl() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  try {
    return (
      window.localStorage.getItem(
        LOGO_STORAGE_KEY
      ) ?? ""
    );
  } catch {
    return "";
  }
}

function storeLogoUrl(
  value: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return;
  }

  try {
    window.localStorage.setItem(
      LOGO_STORAGE_KEY,
      cleaned
    );
  } catch {
    // Local storage is only a backup.
    // A browser privacy setting may prevent access.
  }
}

// ==================================================
// SETTINGS INNER
// ==================================================

function SettingsInner() {
  const router = useRouter();

  // ==================================================
  // PROFILE
  // ==================================================

  const {
    loading,
    isSaving,
    logoUploading,

    displayName,
    setDisplayName,

    email,

    bio,
    setBio,

    logoUrl,

    saveProfile,
    uploadLogo,
    logout,
  } = useSettingsProfile();

  /*
   * Keep a local fallback copy of the logo.
   *
   * The Supabase/profile value remains the primary
   * source of truth. This prevents the UI from losing
   * an uploaded logo if the profile hook temporarily
   * returns an empty value during hydration/refresh.
   */
  const [
    persistentLogoUrl,
    setPersistentLogoUrl,
  ] = useState("");

  // ==================================================
  // RESTORE CACHED LOGO
  // ==================================================

  useEffect(() => {
    const storedLogo =
      getStoredLogoUrl();

    if (storedLogo) {
      setPersistentLogoUrl(
        storedLogo
      );
    }
  }, []);

  // ==================================================
  // KEEP CACHE IN SYNC WITH PROFILE
  // ==================================================

  useEffect(() => {
    const cleanedLogoUrl =
      String(
        logoUrl ?? ""
      ).trim();

    if (!cleanedLogoUrl) {
      return;
    }

    setPersistentLogoUrl(
      cleanedLogoUrl
    );

    storeLogoUrl(
      cleanedLogoUrl
    );
  }, [logoUrl]);

  /*
   * Prefer the actual profile value.
   * Fall back to the latest locally cached logo.
   */
  const resolvedLogoUrl =
    String(
      logoUrl ?? ""
    ).trim() ||
    persistentLogoUrl;

  // ==================================================
  // LOGO UPLOAD WRAPPER
  // ==================================================

  const handleLogoUpload =
    useCallback(
      async (
        ...args: Parameters<
          typeof uploadLogo
        >
      ) => {
        /*
         * The existing hook still performs the
         * real upload.
         */
        const result =
          await uploadLogo(
            ...args
          );

        /*
         * If uploadLogo returns a URL, cache it
         * immediately as an extra safeguard.
         */
        if (
          typeof result ===
          "string" &&
          result.trim()
        ) {
          const uploadedUrl =
            result.trim();

          setPersistentLogoUrl(
            uploadedUrl
          );

          storeLogoUrl(
            uploadedUrl
          );
        }

        return result;
      },
      [uploadLogo]
    );

  // ==================================================
  // SOCIAL CONNECTIONS
  // ==================================================

  const {
    socialAccounts,
    connectionHealth,
    refreshConnections,
    verifyConnections,
    verifyPendingOAuth,
  } = useSocialConnections();

  const [
    showConnectedModal,
    setShowConnectedModal,
  ] = useState(false);

  const [
    connectedPlatformModal,
    setConnectedPlatformModal,
  ] = useState<
    string | null
  >(null);

  // ==================================================
  // TIKTOK OAUTH RESULT
  // ==================================================

  const handleTikTokConnected =
    useCallback(() => {
      setConnectedPlatformModal(
        "tiktok"
      );

      setShowConnectedModal(
        true
      );
    }, []);

  useTikTokOAuthResult({
    refreshConnections,
    verifyConnections,
    onConnected:
      handleTikTokConnected,
  });

  // ==================================================
  // LEGACY OAUTH CALLBACK
  //
  // Used for Meta / LinkedIn.
  // TikTok uses its dedicated server callback.
  // ==================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    // Facebook sometimes appends #_=_
    if (
      window.location.hash ===
      "#_=_"
    ) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const code =
      params.get("code");

    const state =
      params.get("state");

    if (!code || !state) {
      return;
    }

    let cancelled =
      false;

    // ----------------------------------------------
    // CLEAN CALLBACK PARAMETERS
    // ----------------------------------------------

    const cleanOAuthUrl =
      () => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      };

    // ----------------------------------------------
    // HANDLE OAUTH
    // ----------------------------------------------

    const handleLegacyOAuth =
      async () => {
        try {
          let parsedState:
            OAuthState;

          try {
            parsedState =
              JSON.parse(
                decodeURIComponent(
                  state
                )
              ) as OAuthState;
          } catch {
            throw new Error(
              "Invalid OAuth state format"
            );
          }

          const platform =
            parsedState.platform;

          const userId =
            parsedState.userId;

          if (
            !platform ||
            !userId
          ) {
            throw new Error(
              "OAuth state is missing required values"
            );
          }

          // TikTok must use dedicated callback.
          if (
            platform ===
            "tiktok"
          ) {
            cleanOAuthUrl();
            return;
          }

          // ------------------------------------------
          // VERIFY USER
          // ------------------------------------------

          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          if (
            !user ||
            user.id !== userId
          ) {
            throw new Error(
              "OAuth user mismatch"
            );
          }

          // ------------------------------------------
          // EXCHANGE CODE
          // ------------------------------------------

          const response =
            await fetch(
              "/api/oauth/exchange",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    {
                      platform,
                      code,
                      state,
                      userId,
                    }
                  ),
              }
            );

          if (
            !response.ok
          ) {
            const message =
              await response.text();

            throw new Error(
              message ||
                "OAuth exchange failed"
            );
          }

          const tokens =
            (await response.json()) as OAuthTokens;

          if (
            !tokens.access_token
          ) {
            throw new Error(
              "Missing OAuth access token"
            );
          }

          // ------------------------------------------
          // SAVE CONNECTION
          // ------------------------------------------

          const {
            error,
          } =
            await supabase
              .from(
                "social_accounts"
              )
              .upsert(
                {
                  user_id:
                    userId,

                  platform,

                  access_token:
                    tokens.access_token,

                  refresh_token:
                    tokens.refresh_token ||
                    null,

                  expires_at:
                    tokens.expires_at ||
                    null,

                  updated_at:
                    new Date().toISOString(),
                },
                {
                  onConflict:
                    "user_id,platform",
                }
              );

          if (error) {
            throw error;
          }

          // ------------------------------------------
          // CLEAN OAUTH SESSION
          // ------------------------------------------

          sessionStorage.removeItem(
            getOAuthStorageKey(
              platform
            )
          );

          sessionStorage.removeItem(
            "oauth_started_at"
          );

          // ------------------------------------------
          // REFRESH CONNECTION STATE
          // ------------------------------------------

          await refreshConnections();

          await verifyConnections();

          await verifyPendingOAuth();

          // ------------------------------------------
          // SUCCESS
          // ------------------------------------------

          if (!cancelled) {
            toast.success(
              `${platform} connected successfully`
            );

            setConnectedPlatformModal(
              platform
            );

            setShowConnectedModal(
              true
            );
          }
        } catch (
          error
        ) {
          console.error(
            "OAuth callback handling failed:",
            error
          );

          if (!cancelled) {
            toast.error(
              error instanceof
                Error
                ? error.message
                : "OAuth connection failed"
            );
          }
        } finally {
          cleanOAuthUrl();
        }
      };

    void handleLegacyOAuth();

    return () => {
      cancelled =
        true;
    };
  }, [
    refreshConnections,
    verifyConnections,
    verifyPendingOAuth,
  ]);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="animate-spin text-stone-400"
            size={28}
          />

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Initialising Workspace
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-[#faf9f6] to-[#f3f1ec] p-4 text-stone-900 sm:p-6 lg:p-8 xl:p-10">
      {/* ==================================================
          HEADER
      ================================================== */}

      <SettingsHeader
        isSaving={
          isSaving
        }
        onSave={() =>
          void saveProfile()
        }
        onLogout={() =>
          void logout()
        }
        onManageSubscription={() =>
          router.push(
            "/manage-subscription"
          )
        }
      />

      {/* ==================================================
          NAV
      ================================================== */}

      <nav className="mb-8 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-stone-900 px-8 py-4 text-[9px] font-black uppercase text-white"
        >
          Profile
        </button>
      </nav>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <main className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key="account"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            className="space-y-12"
          >
            <section className="space-y-10 rounded-[2rem] border border-stone-200 bg-white/90 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur sm:p-6 lg:space-y-16 lg:rounded-[4rem] lg:p-8">
              {/* ==================================================
                  PROFILE
              ================================================== */}

              <ProfileSettings
                displayName={
                  displayName
                }
                setDisplayName={
                  setDisplayName
                }
                email={
                  email
                }
                bio={
                  bio
                }
                setBio={
                  setBio
                }
                logoUrl={
                  resolvedLogoUrl
                }
                logoUploading={
                  logoUploading
                }
                uploadLogo={
                  handleLogoUpload
                }
              />

              {/* ==================================================
                  SOCIAL MEDIA CONNECTIONS
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">
                <SocialSettings
                  socialAccounts={
                    socialAccounts
                  }
                  connectionHealth={
                    connectionHealth
                  }
                />
              </div>

              {/* ==================================================
                  PASSWORD
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">
                <PasswordSection />
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ==================================================
          LEGAL
      ================================================== */}

      <section className="mt-20 border-t border-stone-200 pt-12">
        <LegalHub />
      </section>

      {/* ==================================================
          CONNECTED SOCIAL ACCOUNT MODAL
      ================================================== */}

      <ConnectedAccountModal
        open={
          showConnectedModal
        }
        platform={
          connectedPlatformModal
        }
        onClose={() => {
          setShowConnectedModal(
            false
          );

          setConnectedPlatformModal(
            null
          );
        }}
      />
    </div>
  );
}

// ==================================================
// PAGE
// ==================================================

export default function Settings() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              className="animate-spin text-stone-400"
              size={28}
            />

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
              Loading Settings
            </p>
          </div>
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}