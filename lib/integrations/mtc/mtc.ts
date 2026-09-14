import "server-only";

type MtcSyncTrigger =
  | "membership_created"
  | "membership_updated"
  | "membership_cancelled"
  | "membership_renewed"
  | "payment_succeeded"
  | "payment_failed"
  | "beneficiaries_updated"
  | "manual"
  | string;

export type MtcMembershipSyncResult = {
  success: boolean;
  source?: string;
  generatedAt?: string | null;

  total?: number;
  syncedCount?: number;
  unresolvedCount?: number;

  synced?: unknown[];
  unresolved?: unknown[];

  message?: string;
  error?: string;

  [key: string]: unknown;
};

type SyncMtcMembershipsOptions = {
  /**
   * A short reason for the sync. This is useful in logs when the helper
   * is called from several different TOTS-OS flows.
   */
  trigger?: MtcSyncTrigger;

  /**
   * When true, an MTC sync failure will be logged and returned instead
   * of throwing. Useful when a Stripe webhook must still return 200
   * after TOTS-OS has already safely persisted the Stripe event.
   *
   * Default: false
   */
  suppressError?: boolean;
};

function requireServerEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[MTC integration] ${name} is missing.`);
  }

  return value;
}

function getMtcMembershipSyncUrl() {
  return requireServerEnv("MTC_MEMBERSHIP_SYNC_URL");
}

function getMtcIntegrationSecret() {
  return requireServerEnv("TOTS_MTC_INTEGRATION_SECRET");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown MTC integration error.";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

async function parseJsonResponse(
  response: Response,
): Promise<MtcMembershipSyncResult> {
  const text = await response.text();

  if (!text) {
    return {
      success: response.ok,
    };
  }

  try {
    const parsed: unknown = JSON.parse(text);

    if (!isObject(parsed)) {
      return {
        success: response.ok,
        message: text,
      };
    }

    return parsed as MtcMembershipSyncResult;
  } catch {
    return {
      success: response.ok,
      message: text,
    };
  }
}

/**
 * Triggers the secure TOTS-OS -> MTC membership synchronisation.
 *
 * Important:
 * - This helper must only be called from server-side TOTS-OS code.
 * - The shared integration secret is never sent to the browser.
 * - TOTS-OS remains the commercial source of truth.
 * - MTC uses the trigger to refresh its mirrored booking entitlements.
 */
export async function syncMtcMemberships(
  options: SyncMtcMembershipsOptions = {},
): Promise<MtcMembershipSyncResult> {
  const {
    trigger = "membership_updated",
    suppressError = false,
  } = options;

  try {
    const url = getMtcMembershipSyncUrl();
    const secret = getMtcIntegrationSecret();

    console.info("[MTC integration] Starting membership sync.", {
      trigger,
    });

    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        trigger,
      }),

      cache: "no-store",
    });

    const payload = await parseJsonResponse(response);

    if (!response.ok && response.status !== 207) {
      const message =
        typeof payload.error === "string" && payload.error.trim()
          ? payload.error
          : typeof payload.message === "string" && payload.message.trim()
            ? payload.message
            : `MTC membership sync failed with status ${response.status}.`;

      throw new Error(message);
    }

    const unresolvedCount =
      typeof payload.unresolvedCount === "number"
        ? payload.unresolvedCount
        : Array.isArray(payload.unresolved)
          ? payload.unresolved.length
          : 0;

    if (response.status === 207 || unresolvedCount > 0) {
      console.warn(
        "[MTC integration] Membership sync completed with unresolved records.",
        {
          trigger,
          status: response.status,
          unresolvedCount,
        },
      );
    } else {
      console.info("[MTC integration] Membership sync completed.", {
        trigger,
        status: response.status,
        syncedCount:
          typeof payload.syncedCount === "number"
            ? payload.syncedCount
            : Array.isArray(payload.synced)
              ? payload.synced.length
              : undefined,
      });
    }

    return payload;
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("[MTC integration] Membership sync failed.", {
      trigger,
      error: message,
    });

    if (suppressError) {
      return {
        success: false,
        error: message,
      };
    }

    throw error;
  }
}

/**
 * Convenience helper for Stripe/webhook flows.
 *
 * Stripe webhooks should generally not fail after TOTS-OS has already
 * persisted the event purely because MTC is temporarily unavailable.
 * This helper logs the MTC failure and returns it instead of throwing.
 */
export async function syncMtcMembershipsSafely(
  trigger: MtcSyncTrigger = "membership_updated",
) {
  return syncMtcMemberships({
    trigger,
    suppressError: true,
  });
}
