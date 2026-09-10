import crypto from "crypto";

// ============================================================
// TYPES
// ============================================================

export type CampaignUnsubscribeTokenPayload = {
  campaignId: string;
  organisationId: string;
  listId: string;
  email: string;
  source: "profile" | "manual";
  recipientId: string;
  iat: number;
  exp: number;
};

// ============================================================
// CONFIG
// ============================================================

/*
 * Unsubscribe links should remain usable for a long time.
 *
 * 10 years means someone opening an old marketing email can
 * still unsubscribe from future communications.
 */
const TOKEN_TTL_SECONDS =
  60 * 60 * 24 * 365 * 10;

// ============================================================
// HELPERS
// ============================================================

function getSecret() {
  /*
   * Prefer a dedicated secret for campaign unsubscribe tokens.
   *
   * The Supabase service role key is retained as a fallback so
   * existing deployments and existing unsubscribe links do not
   * immediately stop working.
   */
  const secret =
    process.env.CAMPAIGN_UNSUBSCRIBE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "CAMPAIGN_UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY is missing"
    );
  }

  return secret;
}

// ============================================================

function sign(
  encodedPayload: string
) {
  return crypto
    .createHmac(
      "sha256",
      getSecret()
    )
    .update(
      encodedPayload
    )
    .digest(
      "base64url"
    );
}

// ============================================================

function normaliseEmail(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

// ============================================================
// CREATE TOKEN
// ============================================================

export function createCampaignUnsubscribeToken(
  input: {
    campaignId: string;
    organisationId: string;
    listId: string;
    email: string;
    source: "profile" | "manual";
    recipientId: string;
    ttlSeconds?: number;
  }
) {
  const now =
    Math.floor(
      Date.now() / 1000
    );

  const email =
    normaliseEmail(
      input.email
    );

  if (!input.campaignId) {
    throw new Error(
      "campaignId is required to create an unsubscribe token"
    );
  }

  if (!input.organisationId) {
    throw new Error(
      "organisationId is required to create an unsubscribe token"
    );
  }

  if (!input.listId) {
    throw new Error(
      "listId is required to create an unsubscribe token"
    );
  }

  if (!email) {
    throw new Error(
      "email is required to create an unsubscribe token"
    );
  }

  if (!input.recipientId) {
    throw new Error(
      "recipientId is required to create an unsubscribe token"
    );
  }

  if (
    input.source !== "profile" &&
    input.source !== "manual"
  ) {
    throw new Error(
      "Invalid unsubscribe recipient source"
    );
  }

  const ttlSeconds =
    input.ttlSeconds ??
    TOKEN_TTL_SECONDS;

  const payload:
    CampaignUnsubscribeTokenPayload =
    {
      campaignId:
        input.campaignId,

      organisationId:
        input.organisationId,

      listId:
        input.listId,

      email,

      source:
        input.source,

      recipientId:
        input.recipientId,

      iat:
        now,

      exp:
        now + ttlSeconds,
    };

  const encodedPayload =
    Buffer
      .from(
        JSON.stringify(
          payload
        ),
        "utf8"
      )
      .toString(
        "base64url"
      );

  const signature =
    sign(
      encodedPayload
    );

  return `${encodedPayload}.${signature}`;
}

// ============================================================
// VERIFY TOKEN
// ============================================================

export function verifyCampaignUnsubscribeToken(
  token: string
):
  | CampaignUnsubscribeTokenPayload
  | null {
  if (
    !token ||
    typeof token !== "string"
  ) {
    return null;
  }

  const parts =
    token.split(".");

  if (
    parts.length !== 2
  ) {
    return null;
  }

  const [
    encodedPayload,
    providedSignature,
  ] = parts;

  if (
    !encodedPayload ||
    !providedSignature
  ) {
    return null;
  }

  // ==========================================================
  // VERIFY SIGNATURE
  // ==========================================================

  let expectedSignature:
    string;

  try {
    expectedSignature =
      sign(
        encodedPayload
      );
  } catch {
    return null;
  }

  let expected:
    Buffer;

  let provided:
    Buffer;

  try {
    expected =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    provided =
      Buffer.from(
        providedSignature,
        "utf8"
      );
  } catch {
    return null;
  }

  if (
    expected.length !==
    provided.length
  ) {
    return null;
  }

  try {
    if (
      !crypto.timingSafeEqual(
        expected,
        provided
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  // ==========================================================
  // DECODE PAYLOAD
  // ==========================================================

  let payload:
    CampaignUnsubscribeTokenPayload;

  try {
    const decoded =
      Buffer
        .from(
          encodedPayload,
          "base64url"
        )
        .toString(
          "utf8"
        );

    payload =
      JSON.parse(
        decoded
      ) as CampaignUnsubscribeTokenPayload;
  } catch {
    return null;
  }

  // ==========================================================
  // VALIDATE PAYLOAD
  // ==========================================================

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {
    return null;
  }

  if (
    !payload.campaignId ||
    typeof payload.campaignId !==
      "string"
  ) {
    return null;
  }

  if (
    !payload.organisationId ||
    typeof payload.organisationId !==
      "string"
  ) {
    return null;
  }

  if (
    !payload.listId ||
    typeof payload.listId !==
      "string"
  ) {
    return null;
  }

  if (
    !payload.email ||
    typeof payload.email !==
      "string"
  ) {
    return null;
  }

  if (
    !payload.recipientId ||
    typeof payload.recipientId !==
      "string"
  ) {
    return null;
  }

  if (
    payload.source !== "profile" &&
    payload.source !== "manual"
  ) {
    return null;
  }

  if (
    typeof payload.iat !==
      "number"
  ) {
    return null;
  }

  if (
    typeof payload.exp !==
      "number"
  ) {
    return null;
  }

  // ==========================================================
  // CHECK EXPIRY
  // ==========================================================

  const now =
    Math.floor(
      Date.now() / 1000
    );

  if (
    payload.exp <= now
  ) {
    return null;
  }

  /*
   * Prevent obviously malformed tokens claiming to have been
   * issued significantly in the future.
   */
  if (
    payload.iat >
    now + 300
  ) {
    return null;
  }

  // ==========================================================
  // NORMALISE RETURNED EMAIL
  // ==========================================================

  payload.email =
    normaliseEmail(
      payload.email
    );

  if (!payload.email) {
    return null;
  }

  return payload;
}