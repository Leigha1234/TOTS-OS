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
  trigger?: MtcSyncTrigger;
  suppressError?: boolean;
};

function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[MTC integration] ${name} is missing.`);
  return value;
}

function getMtcMembershipSyncUrl(): string {
  return requireServerEnv("MTC_MEMBERSHIP_SYNC_URL");
}

function getMtcIntegrationSecret(): string {
  return requireServerEnv("TOTS_MTC_INTEGRATION_SECRET");
}

function getMtcCreditGrantUrl(): string {
  return requireServerEnv("MTC_CREDIT_GRANT_URL");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorDetail(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getErrorMessage(error: unknown): string {
  return errorDetail(error) || "Unknown MTC integration error.";
}

function responseError(
  response: Response,
  payload: Record<string, unknown>,
  fallback: string,
): string {
  const detail = errorDetail(payload.error) || errorDetail(payload.message);
  return `HTTP ${response.status} ${response.statusText}: ${detail || fallback}`;
}

async function parseResponse(
  response: Response,
): Promise<{ payload: Record<string, unknown>; bodyPreview: string }> {
  const text = await response.text();
  let payload: Record<string, unknown> = { success: response.ok };

  if (text) {
    try {
      const parsed: unknown = JSON.parse(text);
      payload = isObject(parsed)
        ? parsed
        : { success: response.ok, message: errorDetail(parsed) };
    } catch {
      payload = { success: response.ok, message: text };
    }
  }

  // Avoid logging HTML pages, credentials, or full upstream error responses.
  return { payload, bodyPreview: text.slice(0, 500) };
}

async function postToMtc(
  url: string,
  secret: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
}

export async function syncMtcMemberships(
  options: SyncMtcMembershipsOptions = {},
): Promise<MtcMembershipSyncResult> {
  const { trigger = "membership_updated", suppressError = false } = options;

  try {
    const url = getMtcMembershipSyncUrl();
    const secret = getMtcIntegrationSecret();

    console.info("[MTC integration] Starting membership sync.", { trigger });

    const response = await postToMtc(url, secret, { trigger });
    const { payload } = await parseResponse(response);

    if (!response.ok && response.status !== 207) {
      throw new Error(
        responseError(response, payload, "MTC membership sync failed."),
      );
    }

    if (payload.success === false && response.status !== 207) {
      throw new Error(
        responseError(response, payload, "MTC reported an unsuccessful membership sync."),
      );
    }

    const result = payload as MtcMembershipSyncResult;
    const unresolvedCount =
      typeof result.unresolvedCount === "number"
        ? result.unresolvedCount
        : Array.isArray(result.unresolved)
          ? result.unresolved.length
          : 0;

    if (response.status === 207 || unresolvedCount > 0) {
      console.warn(
        "[MTC integration] Membership sync completed with unresolved records.",
        { trigger, status: response.status, unresolvedCount },
      );
    } else {
      console.info("[MTC integration] Membership sync completed.", {
        trigger,
        status: response.status,
        syncedCount:
          typeof result.syncedCount === "number"
            ? result.syncedCount
            : Array.isArray(result.synced)
              ? result.synced.length
              : undefined,
      });
    }

    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[MTC integration] Membership sync failed.", {
      trigger,
      error: message,
    });
    if (suppressError) return { success: false, error: message };
    throw error;
  }
}

export async function syncMtcMembershipsSafely(
  trigger: MtcSyncTrigger = "membership_updated",
): Promise<MtcMembershipSyncResult> {
  return syncMtcMemberships({ trigger, suppressError: true });
}

export type MtcPackCreditGrant = {
  orderId: string;
  orderItemId: string;
  email: string;
  sku: string;
  quantity: number;
  planLabel?: string;
};

export type MtcPackCreditGrantResult = {
  success: boolean;
  pending?: boolean;
  alreadyProcessed?: boolean;
  userId?: string;
  creditsAdded?: number;
  packCredits?: number;
  message?: string;
  error?: string;
};

export async function grantMtcPackCreditsSafely(
  grant: MtcPackCreditGrant,
): Promise<MtcPackCreditGrantResult> {
  try {
    const url = getMtcCreditGrantUrl();
    const secret = getMtcIntegrationSecret();

    const response = await postToMtc(url, secret, { ...grant });
    const { payload } = await parseResponse(response);

    if (!response.ok || payload.success === false) {
      const message = responseError(
        response,
        payload,
        "MTC credit grant failed without an error message.",
      );

      console.error("[MTC integration] Credit grant rejected.", {
        status: response.status,
        statusText: response.statusText,
        orderId: grant.orderId,
        orderItemId: grant.orderItemId,
        error: message,
      });

      throw new Error(message);
    }

    const result = payload as MtcPackCreditGrantResult;
    console.info("[MTC integration] Pack credits granted.", {
      orderId: grant.orderId,
      orderItemId: grant.orderItemId,
      quantity: grant.quantity,
      pending: result.pending ?? false,
      alreadyProcessed: result.alreadyProcessed ?? false,
      creditsAdded: result.creditsAdded ?? 0,
    });

    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[MTC integration] Pack credit grant failed.", {
      orderId: grant.orderId,
      orderItemId: grant.orderItemId,
      error: message,
    });
    return { success: false, error: message };
  }
}
