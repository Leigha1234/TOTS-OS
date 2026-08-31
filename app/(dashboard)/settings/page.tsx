"use client";

export const dynamic = "force-dynamic";

import {
  Suspense,
  type ReactNode,
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
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  BellOff,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileUp,
  Globe,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Music2,
  Radio,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  StickyNote,
  Users,
  WalletCards,
  type LucideIcon,
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

import {
  useSettings,
} from "@/app/context/SettingsContext";

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
// TYPES
// ============================================================

type MobileNavOption = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type NotificationPreferenceKey =
  | "finance"
  | "tasks"
  | "projects"
  | "calendar"
  | "social"
  | "business";

type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

type NotificationPreferenceOption = {
  id: NotificationPreferenceKey;
  label: string;
  description: string;
  icon: LucideIcon;
};

// ============================================================
// CONSTANTS
// ============================================================

const LOGO_STORAGE_KEY =
  "tots_os_profile_logo_url";

const DEFAULT_MOBILE_NAV = [
  "/dashboard",
  "/projects",
  "/calendar",
];

const MOBILE_NAV_OPTIONS:
  MobileNavOption[] = [
  {
    href: "/dashboard",
    label: "Home",
    description:
      "Dashboard and daily overview",
    icon: LayoutDashboard,
  },

  {
    href: "/projects",
    label: "Projects",
    description:
      "Client work and delivery",
    icon: Briefcase,
  },

  {
    href: "/calendar",
    label: "Calendar",
    description:
      "Events and deadlines",
    icon: Calendar,
  },

  {
    href: "/crm",
    label: "Contacts",
    description:
      "Clients and contacts",
    icon: Users,
  },

  {
    href: "/payments",
    label: "Finance",
    description:
      "Invoices and business finances",
    icon: WalletCards,
  },

  {
    href: "/campaigns",
    label: "Campaigns",
    description:
      "Marketing campaigns",
    icon: Megaphone,
  },

  {
    href: "/social",
    label: "Social",
    description:
      "Social Studio and publishing",
    icon: Globe,
  },

  {
    href: "/notes",
    label: "Notes",
    description:
      "Notes and business ideas",
    icon: StickyNote,
  },

  {
    href: "/settings",
    label: "Settings",
    description:
      "Workspace preferences",
    icon: SettingsIcon,
  },
];

const DEFAULT_NOTIFICATION_PREFERENCES:
  NotificationPreferences = {
  finance: true,
  tasks: true,
  projects: true,
  calendar: true,
  social: true,
  business: true,
};

const NOTIFICATION_PREFERENCE_OPTIONS:
  NotificationPreferenceOption[] = [
  {
    id: "finance",
    label: "Invoices & payments",
    description:
      "Invoices due or overdue, payments received and important finance activity.",
    icon: WalletCards,
  },

  {
    id: "tasks",
    label: "Tasks & deadlines",
    description:
      "Upcoming tasks, overdue work, assignments and important deadlines.",
    icon: CheckCircle2,
  },

  {
    id: "projects",
    label: "Projects",
    description:
      "Project deadlines, delivery warnings and important project updates.",
    icon: Briefcase,
  },

  {
    id: "calendar",
    label: "Calendar & events",
    description:
      "Upcoming meetings, appointments and calendar reminders.",
    icon: CalendarDays,
  },

  {
    id: "social",
    label: "Social publishing",
    description:
      "Successful posts, publishing failures and scheduled social activity.",
    icon: Megaphone,
  },

  {
    id: "business",
    label: "Clients & business",
    description:
      "New business activity, client updates and important workspace alerts.",
    icon: Users,
  },
];

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

  if (!cleaned) {
    return;
  }

  try {
    window.localStorage.setItem(
      LOGO_STORAGE_KEY,
      cleaned
    );
  } catch {
    // Local storage is only a fallback.
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
    // Best effort only.
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
  value: string | null
) {
  if (!value) {
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

function normaliseMobileNav(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return DEFAULT_MOBILE_NAV;
  }

  const validRoutes =
    new Set(
      MOBILE_NAV_OPTIONS.map(
        (option) =>
          option.href
      )
    );

  const cleaned =
    Array.from(
      new Set(
        value.filter(
          (
            item
          ): item is string =>
            typeof item ===
              "string" &&
            validRoutes.has(
              item
            )
        )
      )
    );

  return cleaned.length === 3
    ? cleaned
    : DEFAULT_MOBILE_NAV;
}

// ============================================================

function normaliseNotificationPreferences(
  value: unknown
): NotificationPreferences {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const object =
    value as Record<
      string,
      unknown
    >;

  return {
    finance:
      typeof object.finance ===
      "boolean"
        ? object.finance
        : true,

    tasks:
      typeof object.tasks ===
      "boolean"
        ? object.tasks
        : true,

    projects:
      typeof object.projects ===
      "boolean"
        ? object.projects
        : true,

    calendar:
      typeof object.calendar ===
      "boolean"
        ? object.calendar
        : true,

    social:
      typeof object.social ===
      "boolean"
        ? object.social
        : true,

    business:
      typeof object.business ===
      "boolean"
        ? object.business
        : true,
  };
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
    useRef(false);

  const socialRefreshInProgressRef =
    useRef(false);

  // ==========================================================
  // GLOBAL SETTINGS CONTEXT
  // ==========================================================

  const {
    mobileNav:
      contextMobileNav,

    refreshSettings,
  } =
    useSettings();

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
  // MOBILE NAVIGATION
  // ==========================================================

  const [
    selectedMobileNav,
    setSelectedMobileNav,
  ] =
    useState<string[]>(
      DEFAULT_MOBILE_NAV
    );

  const [
    mobileNavSaving,
    setMobileNavSaving,
  ] =
    useState(false);

  useEffect(
    () => {
      setSelectedMobileNav(
        normaliseMobileNav(
          contextMobileNav
        )
      );
    },
    [
      contextMobileNav,
    ]
  );

  const toggleMobileNavOption =
    useCallback(
      (
        href: string
      ) => {
        setSelectedMobileNav(
          (
            current
          ) => {
            if (
              current.includes(
                href
              )
            ) {
              return current.filter(
                (
                  item
                ) =>
                  item !==
                  href
              );
            }

            if (
              current.length >=
              3
            ) {
              toast.info(
                "Choose a maximum of 3 mobile shortcuts."
              );

              return current;
            }

            return [
              ...current,
              href,
            ];
          }
        );
      },
      []
    );

  const moveMobileNavOption =
    useCallback(
      (
        index: number,

        direction:
          | "up"
          | "down"
      ) => {
        setSelectedMobileNav(
          (
            current
          ) => {
            const targetIndex =
              direction ===
              "up"
                ? index - 1
                : index + 1;

            if (
              targetIndex < 0 ||
              targetIndex >=
                current.length
            ) {
              return current;
            }

            const next = [
              ...current,
            ];

            const temporary =
              next[index];

            next[index] =
              next[
                targetIndex
              ];

            next[
              targetIndex
            ] =
              temporary;

            return next;
          }
        );
      },
      []
    );

  const saveMobileNavigation =
    useCallback(
      async () => {
        if (
          selectedMobileNav.length !==
          3
        ) {
          toast.error(
            "Choose exactly 3 mobile navigation shortcuts."
          );

          return;
        }

        try {
          setMobileNavSaving(
            true
          );

          const {
            data,
            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError
          ) {
            throw authError;
          }

          if (
            !data.user?.id
          ) {
            throw new Error(
              "You must be signed in to update mobile navigation."
            );
          }

          const {
            error,
          } =
            await supabase
              .from(
                "profiles"
              )
              .update({
                mobile_nav_config:
                  selectedMobileNav,
              })
              .eq(
                "id",
                data.user.id
              );

          if (
            error
          ) {
            throw error;
          }

          await refreshSettings();

          toast.success(
            "Mobile navigation updated"
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS SETTINGS] Mobile navigation save failed:",
            error
          );

          toast.error(
            error instanceof
              Error
              ? error.message
              : "Mobile navigation could not be saved."
          );
        } finally {
          setMobileNavSaving(
            false
          );
        }
      },
      [
        selectedMobileNav,
        refreshSettings,
      ]
    );

  const resetMobileNavigation =
    useCallback(
      () => {
        setSelectedMobileNav(
          DEFAULT_MOBILE_NAV
        );
      },
      []
    );

  // ==========================================================
  // NOTIFICATION CATEGORY PREFERENCES
  // ==========================================================

  const [
    notificationPreferences,
    setNotificationPreferences,
  ] =
    useState<NotificationPreferences>(
      DEFAULT_NOTIFICATION_PREFERENCES
    );

  const [
    notificationPreferencesSaving,
    setNotificationPreferencesSaving,
  ] =
    useState(false);

  const [
    notificationPreferencesLoaded,
    setNotificationPreferencesLoaded,
  ] =
    useState(false);

  useEffect(
    () => {
      let cancelled =
        false;

      const loadPreferences =
        async () => {
          try {
            const {
              data,
              error,
            } =
              await supabase.auth.getUser();

            if (
              error
            ) {
              throw error;
            }

            if (
              cancelled
            ) {
              return;
            }

            const stored =
              data.user
                ?.user_metadata
                ?.tots_notification_preferences;

            setNotificationPreferences(
              normaliseNotificationPreferences(
                stored
              )
            );
          } catch (
            error
          ) {
            console.warn(
              "[TOTS SETTINGS] Notification preference load failed:",
              error
            );
          } finally {
            if (
              !cancelled
            ) {
              setNotificationPreferencesLoaded(
                true
              );
            }
          }
        };

      void loadPreferences();

      return () => {
        cancelled =
          true;
      };
    },
    []
  );

  const toggleNotificationPreference =
    useCallback(
      (
        id:
          NotificationPreferenceKey
      ) => {
        setNotificationPreferences(
          (
            current
          ) => ({
            ...current,

            [id]:
              !current[id],
          })
        );
      },
      []
    );

  const saveNotificationPreferences =
    useCallback(
      async () => {
        try {
          setNotificationPreferencesSaving(
            true
          );

          const {
            error,
          } =
            await supabase.auth.updateUser({
              data: {
                tots_notification_preferences:
                  notificationPreferences,
              },
            });

          if (
            error
          ) {
            throw error;
          }

          toast.success(
            "Notification preferences updated"
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS SETTINGS] Notification preferences save failed:",
            error
          );

          toast.error(
            error instanceof
              Error
              ? error.message
              : "Notification preferences could not be saved."
          );
        } finally {
          setNotificationPreferencesSaving(
            false
          );
        }
      },
      [
        notificationPreferences,
      ]
    );

  const enableAllNotificationPreferences =
    useCallback(
      () => {
        setNotificationPreferences(
          DEFAULT_NOTIFICATION_PREFERENCES
        );
      },
      []
    );

  // ==========================================================
  // PUSH NOTIFICATIONS
  // ==========================================================

  const [
    notificationSupported,
    setNotificationSupported,
  ] =
    useState(false);

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
    useState(false);

  const [
    serviceWorkerReady,
    setServiceWorkerReady,
  ] =
    useState(false);

  const [
    pushSupported,
    setPushSupported,
  ] =
    useState(false);

  const [
    pushSubscribed,
    setPushSubscribed,
  ] =
    useState(false);

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

        const pushAvailable =
          "PushManager" in
          window;

        setPushSupported(
          pushAvailable
        );

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
  // SEND REAL TEST PUSH
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
            {
              error?: string;
              sent?: number;
              failed?: number;
            } | null =
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
              sent === 1
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
    useState(false);

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
  // NOTIFICATION STATE
  // ==========================================================

  const notificationFullyEnabled =
    notificationPermission ===
      "granted" &&
    serviceWorkerReady &&
    pushSubscribed;

  const enabledNotificationCount =
    Object.values(
      notificationPreferences
    ).filter(
      Boolean
    ).length;

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
                  IMPORT HUB
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <FileUp
                      size={14}
                      className="text-[#829473]"
                    />

                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                      Data & migration
                    </p>
                  </div>

                  <h2 className="mt-2 font-serif text-2xl italic text-stone-900">
                    Bring your business into TOTS-OS
                  </h2>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                    Already have contacts,
                    customers or business data
                    somewhere else? Use the Import
                    Hub to bring your existing
                    information into TOTS-OS without
                    starting again from scratch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/settings/import"
                    )
                  }
                  className="group relative w-full overflow-hidden rounded-[2rem] border border-stone-200 bg-[#faf9f6] p-5 text-left transition duration-300 hover:border-[#cdd8c4] hover:bg-[#f6f8f3] hover:shadow-[0_16px_45px_rgba(0,0,0,0.06)] sm:p-6"
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#dfe8d5]/40 blur-3xl transition duration-500 group-hover:bg-[#d6e2cb]/60" />

                  <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-stone-900 text-[#a9b897] shadow-sm transition duration-300 group-hover:scale-[1.03]">
                        <FileUp
                          size={21}
                          strokeWidth={
                            1.8
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-stone-800">
                            Import Hub
                          </h3>

                          <span className="inline-flex items-center rounded-full bg-[#e8efe2] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.15em] text-[#647356]">
                            Workspace tool
                          </span>
                        </div>

                        <p className="mt-2 max-w-xl text-[10px] leading-5 text-stone-500">
                          Import existing business
                          data into TOTS-OS from one
                          central place. Ideal when
                          moving from another CRM,
                          mailing platform, booking
                          system or spreadsheet.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <ImportHubBadge>
                            Contacts
                          </ImportHubBadge>

                          <ImportHubBadge>
                            Customers
                          </ImportHubBadge>

                          <ImportHubBadge>
                            CSV files
                          </ImportHubBadge>

                          <ImportHubBadge>
                            Existing data
                          </ImportHubBadge>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 self-stretch sm:self-auto">
                      <div className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 text-[8px] font-black uppercase tracking-[0.12em] text-white transition duration-300 group-hover:bg-[#a9b897] group-hover:text-stone-900 sm:w-auto">
                        Open Import Hub

                        <ArrowRight
                          size={13}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-5 border-t border-stone-200/80 pt-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={12}
                          className="text-[#829473]"
                        />

                        <span className="text-[8px] font-bold text-stone-500">
                          Keep existing records
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={12}
                          className="text-[#829473]"
                        />

                        <span className="text-[8px] font-bold text-stone-500">
                          Move data faster
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          size={12}
                          className="text-[#829473]"
                        />

                        <span className="text-[8px] font-bold text-stone-500">
                          One central import area
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* ==================================================
                  MOBILE EXPERIENCE
              ================================================== */}

              <div className="border-t border-stone-100 pt-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Smartphone
                        size={14}
                        className="text-[#829473]"
                      />

                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
                        Mobile app
                      </p>
                    </div>

                    <h2 className="mt-2 font-serif text-2xl italic text-stone-900">
                      Your mobile navigation
                    </h2>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                      Choose the 3 areas you use most.
                      They&apos;ll appear in your bottom
                      navigation bar on mobile. The fourth
                      button is always More, so the rest of
                      TOTS-OS stays available.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={
                        resetMobileNavigation
                      }
                      className="min-h-10 rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-400 transition hover:border-stone-300 hover:text-stone-700"
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      disabled={
                        mobileNavSaving ||
                        selectedMobileNav.length !==
                          3
                      }
                      onClick={() =>
                        void saveMobileNavigation()
                      }
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-[8px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {mobileNavSaving ? (
                        <Loader2
                          size={12}
                          className="animate-spin"
                        />
                      ) : (
                        <Save
                          size={12}
                        />
                      )}

                      Save layout
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-stone-200 bg-[#faf9f6] p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                        Mobile dock
                      </p>

                      <p className="mt-1 text-[10px] text-stone-500">
                        {selectedMobileNav.length}
                        /3 shortcuts selected
                      </p>
                    </div>

                    {selectedMobileNav.length ===
                      3 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8efe2] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-[#647356]">
                        <Check
                          size={9}
                        />

                        Ready
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 items-center gap-1 rounded-[1.5rem] border border-stone-200 bg-white p-1.5 shadow-sm">
                    {selectedMobileNav.map(
                      (
                        href
                      ) => {
                        const option =
                          MOBILE_NAV_OPTIONS.find(
                            (
                              item
                            ) =>
                              item.href ===
                              href
                          );

                        if (
                          !option
                        ) {
                          return null;
                        }

                        const Icon =
                          option.icon;

                        return (
                          <div
                            key={
                              href
                            }
                            className="flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] text-stone-400"
                          >
                            <Icon
                              size={20}
                              strokeWidth={
                                1.7
                              }
                            />

                            <span className="max-w-full truncate px-1 text-[7px] font-bold uppercase tracking-[0.03em]">
                              {
                                option.label
                              }
                            </span>
                          </div>
                        );
                      }
                    )}

                    {Array.from({
                      length:
                        Math.max(
                          0,
                          3 -
                            selectedMobileNav.length
                        ),
                    }).map(
                      (
                        _,
                        index
                      ) => (
                        <div
                          key={`empty-nav-${index}`}
                          className="flex h-[58px] items-center justify-center rounded-[1.2rem] border border-dashed border-stone-200 text-[8px] font-bold uppercase text-stone-300"
                        >
                          Empty
                        </div>
                      )
                    )}

                    <div className="flex h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] bg-[#a9b897] text-white">
                      <SettingsIcon
                        size={20}
                        strokeWidth={
                          1.8
                        }
                      />

                      <span className="text-[7px] font-bold uppercase">
                        More
                      </span>
                    </div>
                  </div>

                  {selectedMobileNav.length >
                    0 && (
                    <div className="mt-5">
                      <p className="mb-2 text-[8px] font-black uppercase tracking-[0.16em] text-stone-300">
                        Display order
                      </p>

                      <div className="space-y-2">
                        {selectedMobileNav.map(
                          (
                            href,
                            index
                          ) => {
                            const option =
                              MOBILE_NAV_OPTIONS.find(
                                (
                                  item
                                ) =>
                                  item.href ===
                                  href
                              );

                            if (
                              !option
                            ) {
                              return null;
                            }

                            const Icon =
                              option.icon;

                            return (
                              <div
                                key={
                                  href
                                }
                                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                                  <span className="text-[9px] font-black">
                                    {index +
                                      1}
                                  </span>
                                </div>

                                <Icon
                                  size={15}
                                  className="shrink-0 text-stone-400"
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold text-stone-700">
                                    {
                                      option.label
                                    }
                                  </p>

                                  <p className="truncate text-[8px] text-stone-400">
                                    {
                                      option.description
                                    }
                                  </p>
                                </div>

                                <div className="flex shrink-0 gap-1">
                                  <button
                                    type="button"
                                    disabled={
                                      index ===
                                      0
                                    }
                                    onClick={() =>
                                      moveMobileNavOption(
                                        index,
                                        "up"
                                      )
                                    }
                                    aria-label={`Move ${option.label} left`}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 transition hover:text-stone-800 disabled:opacity-25"
                                  >
                                    <ArrowUp
                                      size={12}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      index ===
                                      selectedMobileNav.length -
                                        1
                                    }
                                    onClick={() =>
                                      moveMobileNavOption(
                                        index,
                                        "down"
                                      )
                                    }
                                    aria-label={`Move ${option.label} right`}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 transition hover:text-stone-800 disabled:opacity-25"
                                  >
                                    <ArrowDown
                                      size={12}
                                    />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {MOBILE_NAV_OPTIONS.map(
                    (
                      option
                    ) => {
                      const selected =
                        selectedMobileNav.includes(
                          option.href
                        );

                      const selectionIndex =
                        selectedMobileNav.indexOf(
                          option.href
                        );

                      const Icon =
                        option.icon;

                      return (
                        <button
                          key={
                            option.href
                          }
                          type="button"
                          onClick={() =>
                            toggleMobileNavOption(
                              option.href
                            )
                          }
                          className={`
                            relative
                            flex
                            min-h-[82px]
                            items-center
                            gap-3
                            rounded-[1.4rem]
                            border
                            p-4
                            text-left
                            transition

                            ${
                              selected
                                ? "border-[#a9b897] bg-[#f4f7f0] shadow-sm"
                                : "border-stone-200 bg-white hover:border-stone-300"
                            }
                          `}
                        >
                          <div
                            className={`
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl

                              ${
                                selected
                                  ? "bg-[#a9b897] text-white"
                                  : "bg-stone-100 text-stone-400"
                              }
                            `}
                          >
                            <Icon
                              size={17}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-stone-700">
                              {
                                option.label
                              }
                            </p>

                            <p className="mt-1 text-[8px] leading-4 text-stone-400">
                              {
                                option.description
                              }
                            </p>
                          </div>

                          {selected && (
                            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[7px] font-black text-white">
                              {selectionIndex +
                                1}
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* ==================================================
                  PUSH NOTIFICATIONS
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
                    Receive push notifications for important
                    TOTS-OS activity — even when the app is
                    closed.
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
                            size={19}
                          />
                        ) : notificationFullyEnabled ? (
                          <Radio
                            size={19}
                          />
                        ) : (
                          <Bell
                            size={19}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-stone-800">
                            Push notifications
                          </p>

                          {notificationFullyEnabled && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8efe2] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#647356]">
                              <CheckCircle2
                                size={9}
                              />

                              Active
                            </span>
                          )}

                          {notificationPermission ===
                            "denied" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-red-500">
                              <BellOff
                                size={9}
                              />

                              Blocked
                            </span>
                          )}

                          {notificationPermission ===
                            "default" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-stone-500">
                              <Clock3
                                size={9}
                              />

                              Not enabled
                            </span>
                          )}

                          {notificationPermission ===
                            "granted" &&
                            !pushSubscribed && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-amber-600">
                                <Clock3
                                  size={9}
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
                                ? "Permission is allowed, but this device has not finished registering for push notifications."
                                : "Turn push notifications on so TOTS-OS can alert you about important business activity."}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
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
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-[9px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {notificationLoading ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Bell
                              size={13}
                            />
                          )}

                          {notificationPermission ===
                          "granted"
                            ? "Complete setup"
                            : "Enable notifications"}
                        </button>
                      )}

                      {notificationFullyEnabled && (
                        <button
                          type="button"
                          onClick={() =>
                            void sendTestNotification()
                          }
                          disabled={
                            notificationLoading
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-[9px] font-black uppercase tracking-[0.12em] text-stone-600 transition hover:border-stone-300 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {notificationLoading ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Radio
                              size={13}
                            />
                          )}

                          Send push test
                        </button>
                      )}
                    </div>
                  </div>

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

                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white">
                  <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                        Alert preferences
                      </p>

                      <h3 className="mt-2 text-sm font-bold text-stone-800">
                        What should TOTS-OS notify you about?
                      </h3>

                      <p className="mt-2 max-w-xl text-[10px] leading-5 text-stone-500">
                        Choose the business activity you want
                        included in your alerts. You currently
                        have {enabledNotificationCount} of{" "}
                        {
                          NOTIFICATION_PREFERENCE_OPTIONS.length
                        }{" "}
                        categories enabled.
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={
                          enableAllNotificationPreferences
                        }
                        className="min-h-10 rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-400 transition hover:text-stone-700"
                      >
                        Enable all
                      </button>

                      <button
                        type="button"
                        disabled={
                          notificationPreferencesSaving ||
                          !notificationPreferencesLoaded
                        }
                        onClick={() =>
                          void saveNotificationPreferences()
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#a9b897] px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-900 transition hover:bg-[#b6c5a5] disabled:opacity-50"
                      >
                        {notificationPreferencesSaving ? (
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                        ) : (
                          <Save
                            size={12}
                          />
                        )}

                        Save alerts
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2">
                    {NOTIFICATION_PREFERENCE_OPTIONS.map(
                      (
                        option,
                        index
                      ) => {
                        const enabled =
                          notificationPreferences[
                            option.id
                          ];

                        const Icon =
                          option.icon;

                        return (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            onClick={() =>
                              toggleNotificationPreference(
                                option.id
                              )
                            }
                            className={`
                              flex
                              items-start
                              gap-4
                              border-stone-100
                              p-5
                              text-left
                              transition

                              ${
                                index <
                                NOTIFICATION_PREFERENCE_OPTIONS.length -
                                  2
                                  ? "border-b"
                                  : ""
                              }

                              ${
                                index %
                                  2 ===
                                0
                                  ? "sm:border-r"
                                  : ""
                              }

                              ${
                                enabled
                                  ? "bg-[#fcfdfb]"
                                  : "bg-white"
                              }
                            `}
                          >
                            <div
                              className={`
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl

                                ${
                                  enabled
                                    ? "bg-[#e8efe2] text-[#71805f]"
                                    : "bg-stone-100 text-stone-300"
                                }
                              `}
                            >
                              <Icon
                                size={16}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-bold text-stone-700">
                                  {
                                    option.label
                                  }
                                </p>

                                <ToggleSwitch
                                  enabled={
                                    enabled
                                  }
                                />
                              </div>

                              <p className="mt-1.5 text-[9px] leading-5 text-stone-400">
                                {
                                  option.description
                                }
                              </p>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {notificationFullyEnabled && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dfe6d7] bg-[#f4f7f0] p-4">
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-[#71805f]"
                    />

                    <div>
                      <p className="text-[10px] font-bold text-stone-700">
                        This device is ready for push notifications
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-stone-500">
                        Use Send push test to test the full
                        server-to-device notification flow.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#dfe6d7] bg-[#f4f7f0] p-4">
                  <ShieldCheck
                    size={16}
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

                {(
                  !notificationSupported ||
                  !pushSupported
                ) && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <BellOff
                      size={16}
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
                <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-[#dfe6d7] bg-gradient-to-r from-[#f4f7f0] to-[#fafbf8] p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-[#a9b897]">
                      <Music2
                        size={18}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-stone-800">
                          TikTok integration
                        </p>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dfe8d5] px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#647356]">
                          <Clock3
                            size={9}
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
// IMPORT HUB BADGE
// ============================================================

function ImportHubBadge({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-stone-400 shadow-sm">
      {
        children
      }
    </span>
  );
}

// ============================================================
// TOGGLE SWITCH
// ============================================================

function ToggleSwitch({
  enabled,
}: {
  enabled:
    boolean;
}) {
  return (
    <span
      className={`
        relative
        inline-flex
        h-6
        w-11
        shrink-0
        items-center
        rounded-full
        transition-colors

        ${
          enabled
            ? "bg-[#a9b897]"
            : "bg-stone-200"
        }
      `}
    >
      <span
        className={`
          block
          h-4
          w-4
          rounded-full
          bg-white
          shadow-sm
          transition-transform

          ${
            enabled
              ? "translate-x-6"
              : "translate-x-1"
          }
        `}
      />
    </span>
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
          size={28}
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