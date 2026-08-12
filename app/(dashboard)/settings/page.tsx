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

// ==================================================
// CONSTANTS
// ==================================================

const LOGO_STORAGE_KEY =
  "tots_os_profile_logo_url";

// ==================================================
// HELPERS
// ==================================================

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
    /*
     * Local storage is only a fallback.
     */
  }
}

function clearOAuthStorage(
  platform: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const key =
      platform === "meta"
        ? "oauth_pending_meta"
        : `oauth_pending_${platform}`;

    window.sessionStorage.removeItem(
      key
    );

    window.sessionStorage.removeItem(
      "oauth_started_at"
    );
  } catch {
    /*
     * OAuth storage cleanup is best-effort.
     */
  }
}

function cleanOAuthUrl() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}

// ==================================================
// SETTINGS INNER
// ==================================================

function SettingsInner() {
  const router =
    useRouter();

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

  // ==================================================
  // PERSISTENT LOGO FALLBACK
  // ==================================================

  const [
    persistentLogoUrl,
    setPersistentLogoUrl,
  ] = useState("");

  useEffect(() => {
    const storedLogo =
      getStoredLogoUrl();

    if (storedLogo) {
      setPersistentLogoUrl(
        storedLogo
      );
    }
  }, []);

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

  const resolvedLogoUrl =
    String(
      logoUrl ?? ""
    ).trim() ||
    persistentLogoUrl;

  // ==================================================
  // LOGO UPLOAD
  // ==================================================

  const handleLogoUpload =
    useCallback(
      async (
        ...args: Parameters<
          typeof uploadLogo
        >
      ) => {
        await uploadLogo(
          ...args
        );
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
  ] =
    useState(false);

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
  // META / LINKEDIN OAUTH RESULT
  //
  // IMPORTANT:
  // Meta's callback + token exchange happen
  // completely server-side now.
  //
  // This page ONLY reacts to:
  //
  // ?oauth=meta_success
  // ?oauth=meta_failed
  // ?oauth=linkedin_success
  // ?oauth=linkedin_failed
  //
  // TikTok remains handled by useTikTokOAuthResult.
  // ==================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    /*
     * Facebook occasionally leaves this hash.
     */
    if (
      window.location.hash ===
      "#_=_"
    ) {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`
      );
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const oauth =
      params.get("oauth");

    if (!oauth) {
      return;
    }

    let cancelled =
      false;

    const handleOAuthResult =
      async () => {
        try {
          // ==================================================
          // META SUCCESS
          // ==================================================

          if (
            oauth ===
            "meta_success"
          ) {
            clearOAuthStorage(
              "meta"
            );

            await refreshConnections();

            await verifyConnections();

            await verifyPendingOAuth();

            if (cancelled) {
              return;
            }

            toast.success(
              "Meta connected successfully"
            );

            setConnectedPlatformModal(
              "meta"
            );

            setShowConnectedModal(
              true
            );

            return;
          }

          // ==================================================
          // META FAILED
          // ==================================================

          if (
            oauth ===
            "meta_failed"
          ) {
            clearOAuthStorage(
              "meta"
            );

            if (cancelled) {
              return;
            }

            const reason =
              params.get(
                "reason"
              );

            let message =
              "Meta connection failed";

            if (reason) {
              try {
                message =
                  decodeURIComponent(
                    reason
                  );
              } catch {
                message =
                  reason;
              }
            }

            toast.error(
              message
            );

            return;
          }

          // ==================================================
          // LINKEDIN SUCCESS
          // ==================================================

          if (
            oauth ===
            "linkedin_success"
          ) {
            clearOAuthStorage(
              "linkedin"
            );

            await refreshConnections();

            await verifyConnections();

            await verifyPendingOAuth();

            if (cancelled) {
              return;
            }

            toast.success(
              "LinkedIn connected successfully"
            );

            setConnectedPlatformModal(
              "linkedin"
            );

            setShowConnectedModal(
              true
            );

            return;
          }

          // ==================================================
          // LINKEDIN FAILED
          // ==================================================

          if (
            oauth ===
            "linkedin_failed"
          ) {
            clearOAuthStorage(
              "linkedin"
            );

            if (cancelled) {
              return;
            }

            const reason =
              params.get(
                "reason"
              );

            let message =
              "LinkedIn connection failed";

            if (reason) {
              try {
                message =
                  decodeURIComponent(
                    reason
                  );
              } catch {
                message =
                  reason;
              }
            }

            toast.error(
              message
            );
          }
        } catch (
          error
        ) {
          console.error(
            "OAuth result handling failed:",
            error
          );

          if (!cancelled) {
            toast.error(
              error instanceof
                Error
                ? error.message
                : "Social account connection could not be verified"
            );
          }
        } finally {
          /*
           * Remove OAuth result from URL so
           * refreshing Settings does not repeat
           * the success/error notification.
           */
          if (!cancelled) {
            cleanOAuthUrl();
          }
        }
      };

    void handleOAuthResult();

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
  // REFRESH CONNECTIONS AFTER PAGE LOAD
  // ==================================================

  useEffect(() => {
    let cancelled =
      false;

    const refresh =
      async () => {
        try {
          await refreshConnections();

          if (cancelled) {
            return;
          }

          await verifyConnections();
        } catch (
          error
        ) {
          console.warn(
            "Initial social connection refresh failed:",
            error
          );
        }
      };

    void refresh();

    return () => {
      cancelled =
        true;
    };
  }, [
    refreshConnections,
    verifyConnections,
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