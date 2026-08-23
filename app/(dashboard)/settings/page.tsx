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
  Bell,
  BellOff,
  CheckCircle2,
  Clock3,
  Loader2,
  Music2,
  ShieldCheck,
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

  const handledOAuthRef =
    useRef(
      false
    );

  const socialRefreshInProgressRef =
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
  // NOTIFICATIONS
  // ==========================================================

  const [
    notificationSupported,
    setNotificationSupported,
  ] =
    useState(
      false
    );

  const [
    notificationPermission,
    setNotificationPermission,
  ] =
    useState<
      NotificationPermission
    >(
      "default"
    );

  const [
    notificationLoading,
    setNotificationLoading,
  ] =
    useState(
      false
    );

  const [
    serviceWorkerReady,
    setServiceWorkerReady,
  ] =
    useState(
      false
    );

  // ==========================================================
  // CHECK NOTIFICATION SUPPORT
  // ==========================================================

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const supported =
        "Notification" in window;

      setNotificationSupported(
        supported
      );

      if (
        supported
      ) {
        setNotificationPermission(
          Notification.permission
        );
      }

      if (
        "serviceWorker" in navigator
      ) {
        navigator.serviceWorker
          .getRegistration()
          .then(
            (
              registration
            ) => {
              setServiceWorkerReady(
                Boolean(
                  registration
                )
              );
            }
          )
          .catch(
            (
              error
            ) => {
              console.warn(
                "[TOTS NOTIFICATIONS] Service worker lookup failed:",
                error
              );

              setServiceWorkerReady(
                false
              );
            }
          );
      }
    },
    []
  );

  // ==========================================================
  // ENABLE NOTIFICATIONS
  // ==========================================================

  const enableNotifications =
    useCallback(
      async () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        if (
          !(
            "Notification" in
            window
          )
        ) {
          toast.error(
            "Notifications are not supported by this browser."
          );

          return;
        }

        try {
          setNotificationLoading(
            true
          );

          const permission =
            await Notification.requestPermission();

          setNotificationPermission(
            permission
          );

          if (
            permission ===
            "granted"
          ) {
            toast.success(
              "Notifications enabled"
            );

            // =================================================
            // OPTIONAL TEST NOTIFICATION
            // =================================================

            if (
              "serviceWorker" in
              navigator
            ) {
              const registration =
                await navigator.serviceWorker.getRegistration();

              if (
                registration
              ) {
                setServiceWorkerReady(
                  true
                );

                await registration.showNotification(
                  "TOTS-OS notifications enabled",
                  {
                    body:
                      "You can now receive important business updates from TOTS-OS.",

                    icon:
                      "/icon.png",

                    badge:
                      "/icon.png",

                    tag:
                      "tots-os-notifications-enabled",
                  }
                );
              }
            }

            return;
          }

          if (
            permission ===
            "denied"
          ) {
            toast.error(
              "Notifications are blocked in your browser settings."
            );

            return;
          }

          toast.info(
            "Notification permission was not enabled."
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Permission request failed:",
            error
          );

          toast.error(
            "Notifications could not be enabled."
          );
        } finally {
          setNotificationLoading(
            false
          );
        }
      },
      []
    );

  // ==========================================================
  // SEND TEST NOTIFICATION
  // ==========================================================

  const sendTestNotification =
    useCallback(
      async () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        if (
          Notification.permission !==
          "granted"
        ) {
          toast.error(
            "Enable notifications first."
          );

          return;
        }

        try {
          setNotificationLoading(
            true
          );

          if (
            "serviceWorker" in
            navigator
          ) {
            const registration =
              await navigator.serviceWorker.getRegistration();

            if (
              registration
            ) {
              await registration.showNotification(
                "TOTS-OS test notification",
                {
                  body:
                    "Your notifications are working correctly.",

                  icon:
                    "/icon.png",

                  badge:
                    "/icon.png",

                  tag:
                    `tots-os-test-${Date.now()}`,
                }
              );

              toast.success(
                "Test notification sent"
              );

              return;
            }
          }

          new Notification(
            "TOTS-OS test notification",
            {
              body:
                "Your notifications are working correctly.",

              icon:
                "/icon.png",
            }
          );

          toast.success(
            "Test notification sent"
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS NOTIFICATIONS] Test notification failed:",
            error
          );

          toast.error(
            "Test notification could not be sent."
          );
        } finally {
          setNotificationLoading(
            false
          );
        }
      },
      []
    );

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

  // ==========================================================
  // REFRESH SOCIAL CONNECTION STATE
  // ==========================================================

  const refreshSocialState =
    useCallback(
      async () => {
        if (
          socialRefreshInProgressRef.current
        ) {
          return;
        }

        socialRefreshInProgressRef.current =
          true;

        try {
          await refreshConnections();

          await verifyConnections();

          await verifyPendingOAuth();

          await refreshConnections();

          await verifyConnections();
        } finally {
          socialRefreshInProgressRef.current =
            false;
        }
      },
      [
        refreshConnections,
        verifyConnections,
        verifyPendingOAuth,
      ]
    );

  // ==========================================================
  // META / LINKEDIN OAUTH RESULT
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

      const handleOAuthResult =
        async () => {
          try {
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

            if (
              oauth ===
                "tiktok_success" ||
              oauth ===
                "tiktok_failed" ||
              connected ===
                "tiktok"
            ) {
              clearOAuthStorage(
                "tiktok"
              );

              if (
                cancelled
              ) {
                return;
              }

              toast.info(
                "TikTok connection is coming soon."
              );

              return;
            }

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
  // ==========================================================

  useEffect(
    () => {
      const handleFocus =
        async () => {
          try {
            await refreshConnections();

            await verifyConnections();
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
      verifyConnections,
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
                  NOTIFICATIONS
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                    Notifications
                  </p>

                  <h2 className="mt-2 font-serif text-2xl italic text-stone-900">
                    Stay on top of your business
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                    Allow TOTS-OS to notify you about orders,
                    invoices, payments, deadlines, tasks,
                    projects and other important business
                    activity.
                  </p>
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-[#faf9f6]">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl

                          ${
                            notificationPermission ===
                            "granted"
                              ? "bg-[#e8efe2] text-[#71805f]"
                              : notificationPermission ===
                                  "denied"
                                ? "bg-red-50 text-red-500"
                                : "bg-stone-900 text-white"
                          }
                        `}
                      >
                        {notificationPermission ===
                        "denied" ? (
                          <BellOff
                            size={
                              19
                            }
                          />
                        ) : (
                          <Bell
                            size={
                              19
                            }
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-stone-800">
                            Browser notifications
                          </p>

                          {notificationPermission ===
                            "granted" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8efe2] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#647356]">
                              <CheckCircle2
                                size={
                                  9
                                }
                              />

                              Enabled
                            </span>
                          )}

                          {notificationPermission ===
                            "denied" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-red-500">
                              <BellOff
                                size={
                                  9
                                }
                              />

                              Blocked
                            </span>
                          )}

                          {notificationPermission ===
                            "default" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-stone-500">
                              <Clock3
                                size={
                                  9
                                }
                              />

                              Not enabled
                            </span>
                          )}
                        </div>

                        <p className="mt-2 max-w-xl text-xs leading-5 text-stone-500">
                          {notificationPermission ===
                          "granted"
                            ? "TOTS-OS is allowed to show notifications on this device."
                            : notificationPermission ===
                                "denied"
                              ? "Your browser is currently blocking TOTS-OS notifications. You will need to allow them in your browser or device settings."
                              : "Turn notifications on so TOTS-OS can alert you about important activity."}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {notificationPermission !==
                        "granted" && (
                        <button
                          type="button"
                          onClick={() =>
                            void enableNotifications()
                          }
                          disabled={
                            notificationLoading ||
                            !notificationSupported
                          }
                          className="
                            inline-flex
                            min-h-11
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-stone-900
                            px-4
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-white
                            transition
                            hover:bg-[#a9b897]
                            hover:text-stone-900
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {notificationLoading ? (
                            <Loader2
                              size={
                                13
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <Bell
                              size={
                                13
                              }
                            />
                          )}

                          Enable notifications
                        </button>
                      )}

                      {notificationPermission ===
                        "granted" && (
                        <button
                          type="button"
                          onClick={() =>
                            void sendTestNotification()
                          }
                          disabled={
                            notificationLoading
                          }
                          className="
                            inline-flex
                            min-h-11
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-stone-200
                            bg-white
                            px-4
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-stone-600
                            transition
                            hover:border-stone-300
                            hover:text-stone-900
                            disabled:opacity-50
                          "
                        >
                          <Bell
                            size={
                              13
                            }
                          />

                          Send test
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ==========================================
                      STATUS ROW
                  ========================================== */}

                  <div className="grid border-t border-stone-200 bg-white sm:grid-cols-3">
                    <NotificationStatus
                      label="Browser support"
                      value={
                        notificationSupported
                          ? "Supported"
                          : "Not supported"
                      }
                      success={
                        notificationSupported
                      }
                    />

                    <NotificationStatus
                      label="Permission"
                      value={
                        notificationPermission ===
                        "granted"
                          ? "Allowed"
                          : notificationPermission ===
                              "denied"
                            ? "Blocked"
                            : "Not requested"
                      }
                      success={
                        notificationPermission ===
                        "granted"
                      }
                    />

                    <NotificationStatus
                      label="Service worker"
                      value={
                        serviceWorkerReady
                          ? "Active"
                          : "Not detected"
                      }
                      success={
                        serviceWorkerReady
                      }
                    />
                  </div>
                </div>

                {/* =================================================
                    IOS / PWA NOTE
                ================================================= */}

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dfe6d7] bg-[#f4f7f0] p-4">
                  <ShieldCheck
                    size={
                      16
                    }
                    className="mt-0.5 shrink-0 text-[#71805f]"
                  />

                  <p className="text-[10px] leading-5 text-stone-500">
                    On iPhone and iPad, install TOTS-OS using
                    <span className="font-bold text-stone-700">
                      {" "}
                      Add to Home Screen{" "}
                    </span>
                    and open the installed app before enabling
                    notifications.
                  </p>
                </div>
              </div>

              {/* ==================================================
                  SOCIAL MEDIA CONNECTIONS
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">

                <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-[#dfe6d7] bg-gradient-to-r from-[#f4f7f0] to-[#fafbf8] p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-[#a9b897]">
                      <Music2
                        size={
                          18
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-stone-800">
                          TikTok integration
                        </p>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dfe8d5] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#647356]">
                          <Clock3
                            size={
                              9
                            }
                          />

                          Coming soon
                        </span>
                      </div>

                      <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                        TikTok account connection and direct
                        publishing are being finalised for
                        TOTS-OS. Facebook, Instagram and
                        LinkedIn can continue to be managed
                        below.
                      </p>
                    </div>
                  </div>
                </div>

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
// NOTIFICATION STATUS
// ============================================================

function NotificationStatus({
  label,
  value,
  success,
}: {
  label:
    string;

  value:
    string;

  success:
    boolean;
}) {
  return (
    <div className="border-b border-stone-100 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[7px] font-black uppercase tracking-[0.16em] text-stone-300">
        {
          label
        }
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`
            h-2
            w-2
            rounded-full

            ${
              success
                ? "bg-[#8fa07d]"
                : "bg-stone-300"
            }
          `}
        />

        <p className="text-[10px] font-bold text-stone-600">
          {
            value
          }
        </p>
      </div>
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