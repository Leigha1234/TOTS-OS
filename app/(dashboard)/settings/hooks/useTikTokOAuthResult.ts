"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  toast,
} from "sonner";

import {
  supabase,
} from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

type UseTikTokOAuthResultOptions = {
  refreshConnections:
    () => Promise<void>;

  verifyConnections:
    () => Promise<void>;

  onConnected?:
    () => void;

  organisationId?:
    string | null;
};

// ============================================================
// ERROR MESSAGES
// ============================================================

const TIKTOK_ERROR_MESSAGES:
  Record<
    string,
    string
  > = {
  rejected:
    "TikTok connection was cancelled or rejected.",

  access_denied:
    "TikTok connection was cancelled or rejected.",

  missing_parameters:
    "TikTok returned incomplete callback information.",

  missing_code:
    "TikTok did not return an authorisation code.",

  missing_state:
    "TikTok did not return the required security state.",

  config:
    "TikTok is not configured correctly.",

  authentication:
    "Your session expired. Please sign in and try again.",

  state_mismatch:
    "TikTok security validation failed. Please reconnect your account.",

  token_exchange:
    "TikTok could not complete the token exchange.",

  token_expiry:
    "TikTok returned an invalid token expiry.",

  profile:
    "TikTok connected, but the profile could not be loaded.",

  database:
    "TikTok connected, but the account could not be saved.",

  unexpected:
    "An unexpected TikTok connection error occurred.",
};

// ============================================================
// HELPERS
// ============================================================

function getTikTokErrorMessage(
  reason:
    string | null
) {
  if (
    !reason
  ) {
    return "TikTok connection failed. Please try again.";
  }

  const cleanedReason =
    reason
      .trim()
      .toLowerCase();

  return (
    TIKTOK_ERROR_MESSAGES[
      cleanedReason
    ] ||
    "TikTok connection failed. Please try again."
  );
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

function clearTikTokOAuthStorage(
  organisationId?:
    string | null
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.sessionStorage.removeItem(
      "oauth_pending_tiktok"
    );

    window.sessionStorage.removeItem(
      "social_oauth_pending_tiktok"
    );

    if (
      organisationId
    ) {
      window.sessionStorage.removeItem(
        `oauth_pending_tiktok_${organisationId}`
      );

      window.sessionStorage.removeItem(
        `social_oauth_pending_tiktok_${organisationId}`
      );
    }

    window.sessionStorage.removeItem(
      "oauth_started_at"
    );

    window.sessionStorage.removeItem(
      "oauth_organisation_id"
    );
  } catch (
    error
  ) {
    console.warn(
      "[TOTS TIKTOK] Could not clear OAuth session storage:",
      error
    );
  }
}

// ============================================================

function decodeReason(
  value:
    string | null
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
// HOOK
// ============================================================

export function useTikTokOAuthResult({
  refreshConnections,

  verifyConnections,

  onConnected,

  organisationId,
}: UseTikTokOAuthResultOptions) {
  const processingRef =
    useRef(
      false
    );

  // ==========================================================
  // HANDLE TIKTOK OAUTH CALLBACK RESULT
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
        processingRef.current
      ) {
        return;
      }

      const params =
        new URLSearchParams(
          window.location.search
        );

      const connected =
        params.get(
          "connected"
        );

      const oauthStatus =
        params.get(
          "oauth"
        );

      const reason =
        decodeReason(
          params.get(
            "reason"
          )
        );

      const socialError =
        decodeReason(
          params.get(
            "social_error"
          )
        );

      // ======================================================
      // SUCCESS CONDITIONS
      // ======================================================

      const isTikTokSuccess =
        connected ===
          "tiktok" ||
        oauthStatus ===
          "tiktok_success";

      // ======================================================
      // FAILURE CONDITIONS
      // ======================================================

      const isTikTokFailure =
        oauthStatus ===
          "tiktok_failed";

      // ======================================================
      // IGNORE NON-TIKTOK CALLBACKS
      // ======================================================

      if (
        !isTikTokSuccess &&
        !isTikTokFailure
      ) {
        return;
      }

      processingRef.current =
        true;

      let cancelled =
        false;

      // ======================================================
      // PROCESS RESULT
      // ======================================================

      const handleTikTokOAuthResult =
        async () => {
          try {
            // ==================================================
            // FAILURE
            // ==================================================

            if (
              isTikTokFailure
            ) {
              clearTikTokOAuthStorage(
                organisationId
              );

              if (
                cancelled
              ) {
                return;
              }

              toast.error(
                socialError ||
                  getTikTokErrorMessage(
                    reason
                  )
              );

              return;
            }

            // ==================================================
            // SUCCESS
            // ==================================================

            const {
              error:
                refreshError,
            } =
              await supabase.auth.refreshSession();

            if (
              refreshError
            ) {
              console.warn(
                "[TOTS TIKTOK] Supabase session refresh failed:",
                refreshError
              );
            }

            /*
             * Do not fail the TikTok connection just because the
             * local Supabase session refresh was unnecessary or
             * failed.
             *
             * The TikTok callback itself runs server-side and may
             * already have successfully written social_accounts.
             */

            await refreshConnections();

            await verifyConnections();

            clearTikTokOAuthStorage(
              organisationId
            );

            if (
              cancelled
            ) {
              return;
            }

            toast.success(
              "TikTok connected successfully"
            );

            onConnected?.();
          } catch (
            error
          ) {
            console.error(
              "[TOTS TIKTOK] OAuth result handling failed:",
              error
            );

            clearTikTokOAuthStorage(
              organisationId
            );

            if (
              !cancelled
            ) {
              toast.error(
                "TikTok connected, but the settings page could not refresh."
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              cleanOAuthUrl();

              processingRef.current =
                false;
            }
          }
        };

      void handleTikTokOAuthResult();

      // ======================================================
      // CLEANUP
      // ======================================================

      return () => {
        cancelled =
          true;

        processingRef.current =
          false;
      };
    },
    [
      organisationId,
      onConnected,
      refreshConnections,
      verifyConnections,
    ]
  );
}