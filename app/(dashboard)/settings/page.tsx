"use client";

export const dynamic = "force-dynamic";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Loader2,
} from "lucide-react";

import {
  toast,
} from "sonner";

import LegalHub from "@/app/components/LegalHub";
import PasswordSection from "@/app/components/PasswordSection";

import ConnectedAccountModal from "./components/ConnectedAccountModal";
import ProfileSettings from "./components/ProfileSettings";
import SettingsHeader from "./components/SettingsHeader";
import SocialSettings from "./components/SocialSettings";

import {
  useSettingsProfile,
} from "./hooks/useSettingsProfile";

import {
  useSocialConnections,
} from "./hooks/useSocialConnections";

import {
  useTikTokOAuthResult,
} from "./hooks/useTikTokOAuthResult";

// ============================================================
// CONSTANTS
// ============================================================

const LOGO_STORAGE_KEY =
  "tots_os_profile_logo_url";

// ============================================================
// HELPERS
// ============================================================

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

// ============================================================

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

  if (
    !cleaned
  ) {
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

// ============================================================

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
    /*
     * Keep support for the existing storage keys
     * used by the social connection flow.
     */

    const possibleKeys = [
      `oauth_pending_${platform}`,
      `social_oauth_pending_${platform}`,
    ];

    if (
      platform ===
      "meta"
    ) {
      possibleKeys.push(
        "oauth_pending_meta",
        "oauth_pending_facebook"
      );
    }

    for (
      const key of
      possibleKeys
    ) {
      window.sessionStorage.removeItem(
        key
      );
    }

    window.sessionStorage.removeItem(
      "oauth_started_at"
    );
  } catch {
    /*
     * OAuth storage cleanup is best-effort.
     */
  }
}

// ============================================================

function cleanOAuthUrl() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  /*
   * Remove OAuth result parameters while keeping the user
   * on the Settings page.
   */

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}

// ============================================================

function decodeOAuthReason(
  value:
    | string
    | null
) {
  if (
    !value
  ) {
    return null;
  }

  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}

// ============================================================
// SETTINGS INNER
// ============================================================

function SettingsInner() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  /*
   * Prevent the same OAuth result from being processed twice
   * if React re-renders the component.
   */

  const handledOAuthRef =
    useRef(
      false
    );

  // ==========================================================
  // PROFILE
  // ==========================================================

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
  } =
    useSettingsProfile();

  // ==========================================================
  // PERSISTENT LOGO FALLBACK
  // ==========================================================

  const [
    persistentLogoUrl,
    setPersistentLogoUrl,
  ] =
    useState("");

  useEffect(
    () => {
      const storedLogo =
        getStoredLogoUrl();

      if (
        storedLogo
      ) {
        setPersistentLogoUrl(
          storedLogo
        );
      }
    },
    []
  );

  useEffect(
    () => {
      const cleanedLogoUrl =
        String(
          logoUrl ??
            ""
        ).trim();

      if (
        !cleanedLogoUrl
      ) {
        return;
      }

      setPersistentLogoUrl(
        cleanedLogoUrl
      );

      storeLogoUrl(
        cleanedLogoUrl
      );
    },
    [
      logoUrl,
    ]
  );

  const resolvedLogoUrl =
    String(
      logoUrl ??
        ""
    ).trim() ||
    persistentLogoUrl;

  // ==========================================================
  // LOGO UPLOAD
  // ==========================================================

  const handleLogoUpload =
    useCallback(
      async (
        ...args:
          Parameters<
            typeof uploadLogo
          >
      ) => {
        await uploadLogo(
          ...args
        );
      },
      [
        uploadLogo,
      ]
    );

  // ==========================================================
  // SOCIAL CONNECTIONS
  // ==========================================================

  const {
    socialAccounts,

    connectionHealth,

    refreshConnections,

    verifyConnections,

    verifyPendingOAuth,
  } =
    useSocialConnections();

  const [
    showConnectedModal,
    setShowConnectedModal,
  ] =
    useState(
      false
    );

  const [
    connectedPlatformModal,
    setConnectedPlatformModal,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    socialRefreshInProgress,
    setSocialRefreshInProgress,
  ] =
    useState(
      false
    );

  // ==========================================================
  // REFRESH SOCIAL CONNECTION STATE
  // ==========================================================

  const refreshSocialState =
    useCallback(
      async () => {
        if (
          socialRefreshInProgress
        ) {
          return;
        }

        setSocialRefreshInProgress(
          true
        );

        try {
          /*
           * First reload social_accounts from Supabase.
           */

          await refreshConnections();

          /*
           * Then check whether the records still have usable
           * platform credentials.
           */

          await verifyConnections();

          /*
           * Finally resolve anything left in the pending OAuth
           * state.
           */

          await verifyPendingOAuth();

          /*
           * Run one final fetch.
           *
           * This is useful when verifyPendingOAuth changed the
           * database or converted a pending account into a
           * connected one.
           */

          await refreshConnections();
        } finally {
          setSocialRefreshInProgress(
            false
          );
        }
      },
      [
        refreshConnections,
        verifyConnections,
        verifyPendingOAuth,
        socialRefreshInProgress,
      ]
    );

  // ==========================================================
  // TIKTOK OAUTH RESULT
  // ==========================================================

  const handleTikTokConnected =
    useCallback(
      () => {
        setConnectedPlatformModal(
          "tiktok"
        );

        setShowConnectedModal(
          true
        );
      },
      []
    );

  useTikTokOAuthResult({
    refreshConnections,

    verifyConnections,

    onConnected:
      handleTikTokConnected,
  });

  // ==========================================================
  // META / LINKEDIN OAUTH RESULT
  //
  // Supported URL formats:
  //
  // NEW:
  // ?oauth=meta_success
  // ?oauth=meta_failed
  //
  // OLD:
  // ?connected=meta
  // ?connected=linkedin
  //
  // Also supports:
  // ?social_error=...
  // ==========================================================

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      if (
        handledOAuthRef.current
      ) {
        return;
      }

      /*
       * Facebook can occasionally append #_=_.
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

      const oauth =
        searchParams.get(
          "oauth"
        );

      const connected =
        searchParams.get(
          "connected"
        );

      const socialError =
        searchParams.get(
          "social_error"
        );

      /*
       * No OAuth result on this visit.
       */

      if (
        !oauth &&
        !connected &&
        !socialError
      ) {
        return;
      }

      handledOAuthRef.current =
        true;

      let cancelled =
        false;

      // ======================================================
      // RESULT HANDLER
      // ======================================================

      const handleOAuthResult =
        async () => {
          try {
            // =================================================
            // LEGACY ERROR
            // =================================================

            if (
              socialError
            ) {
              if (
                cancelled
              ) {
                return;
              }

              toast.error(
                decodeOAuthReason(
                  socialError
                ) ||
                  "Social account connection failed"
              );

              return;
            }

            // =================================================
            // META SUCCESS
            //
            // Supports BOTH:
            //
            // ?oauth=meta_success
            // ?connected=meta
            // =================================================

            if (
              oauth ===
                "meta_success" ||
              connected ===
                "meta" ||
              connected ===
                "facebook"
            ) {
              clearOAuthStorage(
                "meta"
              );

              console.log(
                "[TOTS SOCIAL] Meta OAuth returned successfully."
              );

              await refreshSocialState();

              if (
                cancelled
              ) {
                return;
              }

              console.log(
                "[TOTS SOCIAL] Meta connections refreshed:",
                socialAccounts
              );

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

            // =================================================
            // META FAILED
            // =================================================

            if (
              oauth ===
              "meta_failed"
            ) {
              clearOAuthStorage(
                "meta"
              );

              if (
                cancelled
              ) {
                return;
              }

              const reason =
                decodeOAuthReason(
                  searchParams.get(
                    "reason"
                  )
                );

              toast.error(
                reason ||
                  "Meta connection failed"
              );

              return;
            }

            // =================================================
            // LINKEDIN SUCCESS
            // =================================================

            if (
              oauth ===
                "linkedin_success" ||
              connected ===
                "linkedin"
            ) {
              clearOAuthStorage(
                "linkedin"
              );

              await refreshSocialState();

              if (
                cancelled
              ) {
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

            // =================================================
            // LINKEDIN FAILED
            // =================================================

            if (
              oauth ===
              "linkedin_failed"
            ) {
              clearOAuthStorage(
                "linkedin"
              );

              if (
                cancelled
              ) {
                return;
              }

              const reason =
                decodeOAuthReason(
                  searchParams.get(
                    "reason"
                  )
                );

              toast.error(
                reason ||
                  "LinkedIn connection failed"
              );

              return;
            }
          } catch (
            error:
              unknown
          ) {
            console.error(
              "[TOTS SOCIAL] OAuth result handling failed:",
              error
            );

            if (
              !cancelled
            ) {
              toast.error(
                error instanceof
                  Error
                  ? error.message
                  : "Social account connection could not be verified"
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              /*
               * Allow the social hook a final moment to settle
               * before removing the callback parameters.
               */

              window.setTimeout(
                () => {
                  cleanOAuthUrl();
                },
                250
              );
            }
          }
        };

      void handleOAuthResult();

      return () => {
        cancelled =
          true;
      };
    },
    [
      searchParams,
      refreshSocialState,
      socialAccounts,
    ]
  );

  // ==========================================================
  // INITIAL SOCIAL CONNECTION LOAD
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      const refresh =
        async () => {
          try {
            /*
             * Don't run the generic initial refresh while the
             * OAuth-return handler is already doing it.
             */

            const oauth =
              searchParams.get(
                "oauth"
              );

            const connected =
              searchParams.get(
                "connected"
              );

            if (
              oauth ||
              connected
            ) {
              return;
            }

            await refreshConnections();

            if (
              cancelled
            ) {
              return;
            }

            await verifyConnections();
          } catch (
            error
          ) {
            console.warn(
              "[TOTS SOCIAL] Initial connection refresh failed:",
              error
            );
          }
        };

      void refresh();

      return () => {
        cancelled =
          true;
      };
    },
    [
      refreshConnections,
      verifyConnections,
      searchParams,
    ]
  );

  // ==========================================================
  // RECHECK CONNECTION WHEN WINDOW REGAINS FOCUS
  //
  // This helps if OAuth opened in another browser tab/window.
  // ==========================================================

  useEffect(
    () => {
      const handleFocus =
        async () => {
          try {
            await refreshConnections();
          } catch (
            error
          ) {
            console.warn(
              "[TOTS SOCIAL] Focus refresh failed:",
              error
            );
          }
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );
      };
    },
    [
      refreshConnections,
    ]
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <SettingsLoadingScreen
        text="Initialising Workspace"
      />
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gradient-to-b from-[#faf9f6] to-[#f3f1ec] p-4 text-stone-900 sm:p-6 lg:p-8 xl:p-10">

      {/* ======================================================
          HEADER
      ====================================================== */}

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

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main className="min-h-[500px]">
        <AnimatePresence
          mode="wait"
        >
          <motion.div
            key="account"
            initial={{
              opacity:
                0,

              y:
                20,
            }}
            animate={{
              opacity:
                1,

              y:
                0,
            }}
            exit={{
              opacity:
                0,

              y:
                -20,
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

      {/* ======================================================
          LEGAL
      ====================================================== */}

      <section className="mt-20 border-t border-stone-200 pt-12">
        <LegalHub />
      </section>

      {/* ======================================================
          CONNECTED SOCIAL ACCOUNT MODAL
      ====================================================== */}

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

// ============================================================
// PAGE
// ============================================================

export default function Settings() {
  return (
    <Suspense
      fallback={
        <SettingsLoadingScreen
          text="Loading Settings"
        />
      }
    >
      <SettingsInner />
    </Suspense>
  );
}

// ============================================================
// LOADING SCREEN
// ============================================================

function SettingsLoadingScreen({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
      <div className="flex flex-col items-center gap-4">

        <Loader2
          className="animate-spin text-stone-400"
          size={
            28
          }
        />

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
          {
            text
          }
        </p>

      </div>
    </div>
  );
}