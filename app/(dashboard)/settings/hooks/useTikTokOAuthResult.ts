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
// CONSTANTS
// ============================================================

const TIKTOK_RESULT_STORAGE_KEY =
  "tots_tiktok_oauth_result_processed";

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
    "Your TOTS-OS session could not be verified. Please sign in and try again.",

  state_mismatch:
    "TikTok security validation failed. Please reconnect your account.",

  state_expired:
    "The TikTok connection attempt expired. Please try connecting again.",

  token_exchange:
    "TikTok could not complete the token exchange.",

  token_expiry:
    "TikTok returned an invalid token expiry.",

  missing_video_publish:
    "TikTok did not grant publishing permission. Please reconnect and allow publishing access.",

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

    window.sessionStorage.removeItem(
      "oauth_state_tiktok"
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

      window.sessionStorage.removeItem(
        `oauth_state_tiktok_${organisationId}`
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
// REMOVE ONLY OAUTH PARAMETERS
// ============================================================

function cleanTikTokOAuthUrl() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      "oauth"
    );

    url.searchParams.delete(
      "connected"
    );

    url.searchParams.delete(
      "reason"
    );

    url.searchParams.delete(
      "social_error"
    );

    /*
     * Keep any unrelated Settings query parameters.
     *
     * This is deliberately history.replaceState rather than
     * router.replace or window.location.replace.
     *
     * It changes the visible URL WITHOUT causing another
     * Next.js navigation or page reload.
     */

    const nextUrl =
      `${url.pathname}${
        url.search
      }${
        url.hash
      }`;

    window.history.replaceState(
      window.history.state,
      document.title,
      nextUrl
    );
  } catch (
    error
  ) {
    console.warn(
      "[TOTS TIKTOK] Could not clean OAuth URL:",
      error
    );
  }
}

// ============================================================
// RESULT ID
// ============================================================

function buildOAuthResultId(
  oauthStatus:
    string | null,

  connected:
    string | null,

  reason:
    string | null
) {
  return [
    oauthStatus ||
      "",

    connected ||
      "",

    reason ||
      "",
  ].join(
    "|"
  );
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
  // ==========================================================
  // CALLBACK REFS
  //
  // Store the latest functions in refs so changing callback
  // identities do NOT restart the OAuth result effect.
  // ==========================================================

  const refreshConnectionsRef =
    useRef(
      refreshConnections
    );

  const verifyConnectionsRef =
    useRef(
      verifyConnections
    );

  const onConnectedRef =
    useRef(
      onConnected
    );

  const organisationIdRef =
    useRef(
      organisationId
    );

  const processingRef =
    useRef(
      false
    );

  const processedInThisMountRef =
    useRef<
      string | null
    >(
      null
    );

  // ==========================================================
  // KEEP REFS CURRENT
  // ==========================================================

  useEffect(
    () => {
      refreshConnectionsRef.current =
        refreshConnections;
    },
    [
      refreshConnections,
    ]
  );

  useEffect(
    () => {
      verifyConnectionsRef.current =
        verifyConnections;
    },
    [
      verifyConnections,
    ]
  );

  useEffect(
    () => {
      onConnectedRef.current =
        onConnected;
    },
    [
      onConnected,
    ]
  );

  useEffect(
    () => {
      organisationIdRef.current =
        organisationId;
    },
    [
      organisationId,
    ]
  );

  // ==========================================================
  // HANDLE TIKTOK CALLBACK RESULT
  //
  // IMPORTANT:
  //
  // This effect intentionally runs once on mount.
  //
  // We do NOT depend on refreshConnections / verifyConnections /
  // onConnected because changing function identities can cause
  // callback processing to restart before the URL is cleaned.
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

      // ======================================================
      // READ CALLBACK RESULT
      // ======================================================

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

      const isTikTokSuccess =
        connected ===
          "tiktok" ||
        oauthStatus ===
          "tiktok_success";

      const isTikTokFailure =
        oauthStatus ===
          "tiktok_failed";

      // ======================================================
      // NOT A TIKTOK CALLBACK
      // ======================================================

      if (
        !isTikTokSuccess &&
        !isTikTokFailure
      ) {
        return;
      }

      // ======================================================
      // BUILD UNIQUE RESULT ID
      // ======================================================

      const resultId =
        buildOAuthResultId(
          oauthStatus,
          connected,
          reason
        );

      // ======================================================
      // STOP DUPLICATE PROCESSING IN SAME MOUNT
      // ======================================================

      if (
        processedInThisMountRef.current ===
        resultId
      ) {
        console.log(
          "[TOTS TIKTOK] OAuth result already processed in this page mount:",
          resultId
        );

        cleanTikTokOAuthUrl();

        return;
      }

      // ======================================================
      // STOP DUPLICATE PROCESSING AFTER FAST REMOUNT
      //
      // React Strict Mode can mount development effects twice.
      // Session storage gives us another guard.
      // ======================================================

      try {
        const previouslyProcessed =
          window.sessionStorage.getItem(
            TIKTOK_RESULT_STORAGE_KEY
          );

        if (
          previouslyProcessed ===
          resultId
        ) {
          console.log(
            "[TOTS TIKTOK] OAuth result already processed:",
            resultId
          );

          cleanTikTokOAuthUrl();

          return;
        }
      } catch {
        /*
         * Session storage may be blocked in some browser modes.
         * The in-memory ref still protects this mount.
         */
      }

      // ======================================================
      // LOCK IMMEDIATELY
      // ======================================================

      processingRef.current =
        true;

      processedInThisMountRef.current =
        resultId;

      try {
        window.sessionStorage.setItem(
          TIKTOK_RESULT_STORAGE_KEY,
          resultId
        );
      } catch {
        /*
         * Best effort only.
         */
      }

      /*
       * CRITICAL:
       *
       * Remove the callback parameters BEFORE any async work.
       *
       * That means even if refreshConnections causes renders,
       * subscriptions, session refreshes or component remounts,
       * the browser no longer looks like it is sitting on an
       * OAuth callback result.
       */

      cleanTikTokOAuthUrl();

      console.log(
        "[TOTS TIKTOK] Processing OAuth result once:",
        {
          oauthStatus,

          connected,

          reason,

          success:
            isTikTokSuccess,

          failure:
            isTikTokFailure,
        }
      );

      // ======================================================
      // PROCESS ASYNC
      // ======================================================

      const processResult =
        async () => {
          try {
            // ==================================================
            // FAILURE
            // ==================================================

            if (
              isTikTokFailure
            ) {
              clearTikTokOAuthStorage(
                organisationIdRef.current
              );

              console.error(
                "[TOTS TIKTOK] OAuth failed:",
                {
                  reason,

                  socialError,
                }
              );

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

            /*
             * The callback already verified the server-side
             * Supabase session before storing the account.
             *
             * refreshSession here is therefore optional.
             * We still attempt it, but it must never control
             * whether TikTok is considered connected.
             */

            try {
              const {
                error:
                  refreshError,
              } =
                await supabase.auth.refreshSession();

              if (
                refreshError
              ) {
                console.warn(
                  "[TOTS TIKTOK] Supabase session refresh warning:",
                  refreshError
                );
              }
            } catch (
              refreshError
            ) {
              console.warn(
                "[TOTS TIKTOK] Supabase session refresh threw:",
                refreshError
              );
            }

            // ==================================================
            // REFRESH CONNECTION RECORDS
            // ==================================================

            try {
              await refreshConnectionsRef
                .current();
            } catch (
              refreshError
            ) {
              console.warn(
                "[TOTS TIKTOK] Could not refresh connections:",
                refreshError
              );
            }

            // ==================================================
            // VERIFY CONNECTION HEALTH
            // ==================================================

            try {
              await verifyConnectionsRef
                .current();
            } catch (
              verifyError
            ) {
              console.warn(
                "[TOTS TIKTOK] Could not verify connections:",
                verifyError
              );
            }

            // ==================================================
            // CLEAR OAUTH FLAGS
            // ==================================================

            clearTikTokOAuthStorage(
              organisationIdRef.current
            );

            // ==================================================
            // SUCCESS MESSAGE
            // ==================================================

            toast.success(
              "TikTok connected successfully"
            );

            // ==================================================
            // OPTIONAL CALLBACK
            // ==================================================

            try {
              onConnectedRef
                .current?.();
            } catch (
              callbackError
            ) {
              console.warn(
                "[TOTS TIKTOK] onConnected callback failed:",
                callbackError
              );
            }
          } catch (
            error
          ) {
            console.error(
              "[TOTS TIKTOK] OAuth result handling failed:",
              error
            );

            clearTikTokOAuthStorage(
              organisationIdRef.current
            );

            toast.error(
              "TikTok connected, but the settings page could not refresh."
            );
          } finally {
            /*
             * Do not reset the processed result.
             *
             * The URL has already been cleaned and the result
             * should never be handled a second time.
             */

            processingRef.current =
              false;
          }
        };

      void processResult();

      /*
       * No cleanup that resets processingRef.
       *
       * Resetting that value during a React effect cleanup was
       * one of the ways this callback could be re-entered.
       */
    },
    []
  );
}