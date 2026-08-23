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
  Radio,
  ShieldCheck,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  supabase,
} from "@/lib/supabase";

import {
  enablePushNotifications,
} from "@/lib/pushNotifications";

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

  const [
    pushSupported,
    setPushSupported,
  ] =
    useState(
      false
    );

  const [
    pushSubscribed,
    setPushSubscribed,
  ] =
    useState(
      false
    );

  // ==========================================================
  // CHECK NOTIFICATION / PUSH STATUS
  // ==========================================================

  const refreshNotificationStatus =
    useCallback(
      async () => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        // ====================================================
        // NOTIFICATION API
        // ====================================================

        const notificationsAvailable =
          "Notification" in
          window;

        setNotificationSupported(
          notificationsAvailable
        );

        if (
          notificationsAvailable
        ) {
          setNotificationPermission(
            Notification.permission
          );
        }

        // ====================================================
        // PUSH API
        // ====================================================

        const pushAvailable =
          "PushManager" in
          window;

        setPushSupported(
          pushAvailable
        );

        // ====================================================
        // SERVICE WORKER
        // ====================================================

        if (
          !(
            "serviceWorker" in
            navigator
          )
        ) {
          setServiceWorkerReady(
            false
          );

          setPushSubscribed(
            false
          );

          return;
        }

        try {
          const registration =
            await navigator
              .serviceWorker
              .getRegistration(
                "/"
              );

          setServiceWorkerReady(
            Boolean(
              registration
            )
          );

          if (
            registration &&
            pushAvailable
          ) {
            const subscription =
              await registration
                .pushManager
                .getSubscription();

            setPushSubscribed(
              Boolean(
                subscription
              )
            );
          } else {
            setPushSubscribed(
              false
            );
          }
        } catch (
          error
        ) {
          console.warn(
            "[TOTS NOTIFICATIONS] Status check failed:",
            error
          );

          setServiceWorkerReady(
            false
          );

          setPushSubscribed(
            false
          );
        }
      },
      []
    );

  // ==========================================================
  // INITIAL NOTIFICATION STATUS
  // ==========================================================

  useEffect(
    () => {
      void refreshNotificationStatus();
    },
    [
      refreshNotificationStatus,
    ]
  );

  // ==========================================================
  // REFRESH STATUS WHEN WINDOW RETURNS
  // ==========================================================

  useEffect(
    () => {
      const handleFocus =
        () => {
          void refreshNotificationStatus();
        };

      const handleVisibility =
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            void refreshNotificationStatus();
          }
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      document.addEventListener(
        "visibilitychange",
        handleVisibility
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );

        document.removeEventListener(
          "visibilitychange",
          handleVisibility
        );
      };
    },
    [
      refreshNotificationStatus,
    ]
  );

  // ==========================================================
  // ENABLE PUSH NOTIFICATIONS
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

        if (
          !(
            "serviceWorker" in
            navigator
          )
        ) {
          toast.error(
            "Service workers are not supported on this device."
          );

          return;
        }

        if (
          !(
            "PushManager" in
            window
          )
        ) {
          toast.error(
            "Push notifications are not supported on this device."
          );

          return;
        }

        try {
          setNotificationLoading(
            true
          );

          // =================================================
          // REAL PUSH SUBSCRIPTION
          //
          // This:
          // 1. asks permission
          // 2. registers / finds service worker
          // 3. creates PushManager subscription
          // 4. sends it to /api/push/subscribe
          // 5. stores it in Supabase
          // =================================================

          await enablePushNotifications();

          await refreshNotificationStatus();

          setNotificationPermission(
            Notification.permission
          );

          setPushSubscribed(
            true
          );

          setServiceWorkerReady(
            true
          );

          toast.success(
            "Push notifications enabled"
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS PUSH] Enable failed:",
            error
          );

          await refreshNotificationStatus();

          if (
            Notification.permission ===
            "denied"
          ) {
            toast.error(
              "Notifications are blocked. Allow them in your browser or device settings."
            );

            return;
          }

          toast.error(
            error instanceof
              Error
              ? error.message
              : "Push notifications could not be enabled."
          );
        } finally {
          setNotificationLoading(
            false
          );
        }
      },
      [
        refreshNotificationStatus,
      ]
    );

  // ==========================================================
  // SEND REAL TEST PUSH NOTIFICATION
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

        if (
          !pushSubscribed
        ) {
          toast.error(
            "This device is not subscribed to push notifications yet."
          );

          return;
        }

        try {
          setNotificationLoading(
            true
          );

          // =================================================
          // AUTH TOKEN
          // =================================================

          const {
            data:
              sessionData,

            error:
              sessionError,
          } =
            await supabase
              .auth
              .getSession();

          if (
            sessionError
          ) {
            throw sessionError;
          }

          const accessToken =
            sessionData
              ?.session
              ?.access_token;

          if (
            !accessToken
          ) {
            throw new Error(
              "You must be signed in to send a test notification."
            );
          }

          // =================================================
          // SERVER-SENT PUSH
          //
          // This is intentionally NOT registration.showNotification().
          // It tests the real server → push service → device flow.
          // =================================================

          const response =
            await fetch(
              "/api/push/test",
              {
                method:
                  "POST",

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,

                  "Content-Type":
                    "application/json",
                },

                cache:
                  "no-store",
              }
            );

          let result:
            any =
            null;

          try {
            result =
              await response.json();
          } catch {
            result =
              null;
          }

          if (
            !response.ok
          ) {
            throw new Error(
              result?.error ||
              "Test push notification could not be sent."
            );
          }

          const sent =
            Number(
              result?.sent ??
              0
            );

          const failed =
            Number(
              result?.failed ??
              0
            );

          if (
            sent >
            0
          ) {
            toast.success(
              sent ===
              1
                ? "Test push sent to your device"
                : `Test push sent to ${sent} devices`
            );

            return;
          }

          if (
            failed >
            0
          ) {
            toast.error(
              "The push service received the request but delivery failed."
            );

            return;
          }

          toast.error(
            "No registered push devices were found for this workspace."
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS PUSH] Test failed:",
            error
          );

          toast.error(
            error instanceof
              Error
              ? error.message
              : "Test notification could not be sent."
          );
        } finally {
          setNotificationLoading(
            false
          );
        }
      },
      [
        pushSubscribed,
      ]
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
  // NOTIFICATION COPY
  // ==========================================================

  const notificationFullyEnabled =
    notificationPermission ===
      "granted" &&
    serviceWorkerReady &&
    pushSubscribed;

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
                  PUSH NOTIFICATIONS
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">

                {/* ================================================
                    HEADING
                ================================================ */}

                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                    Notifications
                  </p>

                  <h2 className="mt-2 font-serif text-2xl italic text-stone-900">
                    Stay on top of your business
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                    Receive push notifications for new orders,
                    invoices, payments, deadlines, tasks,
                    projects and other important TOTS-OS
                    activity — even when the app is closed.
                  </p>
                </div>

                {/* ================================================
                    MAIN NOTIFICATION CARD
                ================================================ */}

                <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-[#faf9f6]">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-start gap-4">

                      {/* ICON */}

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
                            notificationFullyEnabled
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
                        ) : notificationFullyEnabled ? (
                          <Radio
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

                      {/* COPY */}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-stone-800">
                            Push notifications
                          </p>

                          {notificationFullyEnabled && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8efe2] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#647356]">
                              <CheckCircle2
                                size={
                                  9
                                }
                              />

                              Active
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

                          {notificationPermission ===
                            "granted" &&
                            !pushSubscribed && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-amber-600">
                                <Clock3
                                  size={
                                    9
                                  }
                                />

                                Setup incomplete
                              </span>
                            )}
                        </div>

                        <p className="mt-2 max-w-xl text-xs leading-5 text-stone-500">
                          {notificationFullyEnabled
                            ? "This device is registered for TOTS-OS push notifications. Alerts can be delivered even when TOTS-OS is closed."
                            : notificationPermission ===
                                "denied"
                              ? "Your browser or device is blocking TOTS-OS notifications. Change notification permissions in your browser or device settings before trying again."
                              : notificationPermission ===
                                    "granted" &&
                                  !pushSubscribed
                                ? "Permission is allowed, but this device has not finished registering for push notifications. Press Enable notifications to complete setup."
                                : "Turn push notifications on so TOTS-OS can alert you about important business activity."}
                        </p>
                      </div>
                    </div>

                    {/* ==========================================
                        ACTIONS
                    ========================================== */}

                    <div className="flex shrink-0 flex-wrap gap-2">

                      {/* ENABLE / COMPLETE SETUP */}

                      {!notificationFullyEnabled && (
                        <button
                          type="button"
                          onClick={() =>
                            void enableNotifications()
                          }
                          disabled={
                            notificationLoading ||
                            !notificationSupported ||
                            !pushSupported
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

                          {notificationPermission ===
                          "granted"
                            ? "Complete setup"
                            : "Enable notifications"}
                        </button>
                      )}

                      {/* SEND REAL PUSH TEST */}

                      {notificationFullyEnabled && (
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
                            <Radio
                              size={
                                13
                              }
                            />
                          )}

                          Send push test
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ==========================================
                      STATUS ROW
                  ========================================== */}

                  <div className="grid border-t border-stone-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
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

                    <NotificationStatus
                      label="Push subscription"
                      value={
                        pushSubscribed
                          ? "Registered"
                          : pushSupported
                            ? "Not registered"
                            : "Not supported"
                      }
                      success={
                        pushSubscribed
                      }
                    />
                  </div>
                </div>

                {/* ================================================
                    READY CONFIRMATION
                ================================================ */}

                {notificationFullyEnabled && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dfe6d7] bg-[#f4f7f0] p-4">
                    <CheckCircle2
                      size={
                        16
                      }
                      className="mt-0.5 shrink-0 text-[#71805f]"
                    />

                    <div>
                      <p className="text-[10px] font-bold text-stone-700">
                        This device is ready for push notifications
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-stone-500">
                        Use Send push test to test the full
                        server-to-device notification flow. You
                        can lock your phone or close TOTS-OS
                        before sending the test.
                      </p>
                    </div>
                  </div>
                )}

                {/* ================================================
                    IOS / PWA NOTE
                ================================================ */}

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dfe6d7] bg-[#f4f7f0] p-4">
                  <ShieldCheck
                    size={
                      16
                    }
                    className="mt-0.5 shrink-0 text-[#71805f]"
                  />

                  <p className="text-[10px] leading-5 text-stone-500">
                    On iPhone and iPad, open TOTS-OS in Safari,
                    choose
                    <span className="font-bold text-stone-700">
                      {" "}
                      Add to Home Screen
                    </span>
                    , open the installed TOTS-OS app, sign in,
                    then enable notifications from this page.
                  </p>
                </div>

                {/* ================================================
                    UNSUPPORTED NOTE
                ================================================ */}

                {(
                  !notificationSupported ||
                  !pushSupported
                ) && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <BellOff
                      size={
                        16
                      }
                      className="mt-0.5 shrink-0 text-amber-500"
                    />

                    <p className="text-[10px] leading-5 text-amber-700">
                      This browser does not currently expose all
                      of the APIs required for web push. On
                      iPhone, make sure you are using the
                      installed Home Screen version of TOTS-OS
                      rather than a normal Safari tab.
                    </p>
                  </div>
                )}
              </div>

              {/* ==================================================
                  SOCIAL MEDIA CONNECTIONS
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">

                {/* ================================================
                    TIKTOK NOTICE
                ================================================ */}

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
    <div className="border-b border-stone-100 p-4 last:border-b-0 sm:border-r xl:border-b-0 xl:last:border-r-0">
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