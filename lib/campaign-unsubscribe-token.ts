import crypto from "crypto";

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

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  return secret;
}

function sign(encodedPayload: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createCampaignUnsubscribeToken(input: {
  campaignId: string;
  organisationId: string;
  listId: string;
  email: string;
  source: "profile" | "manual";
  recipientId: string;
  ttlSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);

  const payload: CampaignUnsubscribeTokenPayload = {
    campaignId: input.campaignId,
    organisationId: input.organisationId,
    listId: input.listId,
    email: input.email.toLowerCase().trim(),
    source: input.source,
    recipientId: input.recipientId,
    iat: now,
    exp: now + (input.ttlSeconds ?? TOKEN_TTL_SECONDS),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyCampaignUnsubscribeToken(token: string) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);

  if (
    expected.length !== provided.length ||
    !crypto.timingSafeEqual(expected, provided)
  ) {
    return null;
  }

  let payload: CampaignUnsubscribeTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as CampaignUnsubscribeTokenPayload;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    !payload?.campaignId ||
    !payload?.organisationId ||
    !payload?.listId ||
    !payload?.email ||
    !payload?.recipientId
  ) {
    return null;
  }

  if (!payload.exp || payload.exp < now) {
    return null;
  }

  return payload;
}