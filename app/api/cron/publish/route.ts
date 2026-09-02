// app/api/cron/publish/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const DEFAULT_META_GRAPH_VERSION = "v25.0";
const TIKTOK_MIN_CHUNK_SIZE = 5_000_000;
const TIKTOK_MAX_CHUNK_SIZE = 64_000_000;
const TIKTOK_MAX_FINAL_CHUNK_SIZE = 128_000_000;
const TIKTOK_MAX_CHUNKS = 1000;
const TIKTOK_MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024;
const TIKTOK_MAX_PHOTOS = 35;

// ============================================================
// TYPES
// ============================================================

type MetaConnection = {
  id: string;
  user_id: string;
  organisation_id?: string | null;
  platform: string;
  access_token: string | null;
  expires_at: string | null;
  page_id: string | null;
  page_name: string | null;
  page_access_token: string | null;
  instagram_business_account_id: string | null;
};

type TikTokConnection = {
  id: string;
  user_id: string;
  organisation_id?: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  platform_user_id?: string | null;
};

type TikTokPostSettings = {
  privacy_level?: string | null;
  allow_comment?: boolean;
  allow_duet?: boolean;
  allow_stitch?: boolean;
  commercial_content?: boolean;
  brand_organic_toggle?: boolean;
  brand_content_toggle?: boolean;
  is_aigc?: boolean;
  consent_given?: boolean;
};

type PublishCounters = {
  processed: number;
  published: number;
  failed: number;
  processing: number;
  skipped: number;
};

type NotificationType = "success" | "error" | "warning" | "info";

type NotificationInput = {
  supabase: any;
  userId: string;
  organisationId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, unknown>;
};

class PermanentPublishError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "PermanentPublishError";
    this.code = code;
  }
}

class TikTokApiError extends Error {
  code: string;
  responseData: any;
  permanent: boolean;

  constructor(message: string, code: string, responseData: any, permanent: boolean) {
    super(message);
    this.name = "TikTokApiError";
    this.code = code;
    this.responseData = responseData;
    this.permanent = permanent;
  }
}

// ============================================================
// BASIC HELPERS
// ============================================================

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function getMetaGraphVersion() {
  const configured = process.env.META_GRAPH_API_VERSION?.trim();
  if (!configured) return DEFAULT_META_GRAPH_VERSION;
  return configured.startsWith("v") ? configured : `v${configured}`;
}

function tokenExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  if (Number.isNaN(timestamp)) return false;
  return timestamp <= Date.now() + 60_000;
}

function getPlatformLabel(platform: string) {
  switch (cleanString(platform).toLowerCase()) {
    case "facebook": return "Facebook";
    case "instagram": return "Instagram";
    case "linkedin": return "LinkedIn";
    case "tiktok": return "TikTok";
    case "pinterest": return "Pinterest";
    case "meta": return "Meta";
    default: return cleanString(platform) || "Social";
  }
}

function getCleanMediaUrl(mediaUrl: string) {
  return mediaUrl.toLowerCase().split("?")[0].split("#")[0];
}

function isVideoMediaUrl(mediaUrl: string) {
  if (!mediaUrl) return false;
  const cleanUrl = getCleanMediaUrl(mediaUrl);
  return [".mp4", ".mov", ".m4v", ".webm", ".avi"].some((extension) => cleanUrl.endsWith(extension));
}

function getPostMediaUrls(post: any): string[] {
  const urls: string[] = [];
  const rawMediaUrls = post?.media_urls;

  if (Array.isArray(rawMediaUrls)) {
    for (const value of rawMediaUrls) {
      const url = cleanString(value);
      if (url && !urls.includes(url)) urls.push(url);
    }
  }

  if (typeof rawMediaUrls === "string" && cleanString(rawMediaUrls)) {
    try {
      const parsed = JSON.parse(rawMediaUrls);
      if (Array.isArray(parsed)) {
        for (const value of parsed) {
          const url = cleanString(value);
          if (url && !urls.includes(url)) urls.push(url);
        }
      }
    } catch {
      // Ignore invalid JSON.
    }
  }

  if (urls.length === 0) {
    const legacyUrl = cleanString(post?.media_url);
    if (legacyUrl) urls.push(legacyUrl);
  }

  return urls;
}

function parseTikTokSettings(value: unknown): TikTokPostSettings {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as TikTokPostSettings;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

async function safeJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

async function createNotification({
  supabase,
  userId,
  organisationId = null,
  title,
  message,
  type,
  link = "/social",
  metadata = {},
}: NotificationInput) {
  if (!userId || !title || !message) return;

  const baseNotification: Record<string, unknown> = {
    user_id: userId,
    title,
    message,
    type,
    link,
    metadata,
    created_at: new Date().toISOString(),
  };

  if (organisationId) baseNotification.organisation_id = organisationId;

  try {
    const { error } = await supabase.from("notifications").insert({ ...baseNotification, is_read: false });
    if (!error) return;

    const errorMessage = cleanString(error.message).toLowerCase();
    if (!errorMessage.includes("is_read") && !errorMessage.includes("column")) {
      console.warn("[NOTIFICATIONS] Insert failed:", error);
      return;
    }
  } catch (error) {
    console.warn("[NOTIFICATIONS] Primary insert failed:", error);
  }

  try {
    const { error } = await supabase.from("notifications").insert({ ...baseNotification, read: false });
    if (error) console.warn("[NOTIFICATIONS] Legacy insert failed:", error);
  } catch (error) {
    console.warn("[NOTIFICATIONS] Unexpected error:", error);
  }
}

// ============================================================
// META HELPERS
// ============================================================

function getMetaErrorMessage(value: any) {
  return value?.error?.message || value?.message || value?.raw || (value ? JSON.stringify(value) : "") || "Unknown Meta error";
}

async function getMetaConnection({ supabase, post }: { supabase: any; post: any }) {
  if (!post.user_id) throw new PermanentPublishError("Social post has no user_id.");

  let query = supabase
    .from("social_accounts")
    .select(`id,user_id,organisation_id,platform,access_token,expires_at,page_id,page_name,page_access_token,instagram_business_account_id`)
    .eq("user_id", post.user_id)
    .eq("platform", "meta");

  if (post.organisation_id) query = query.eq("organisation_id", post.organisation_id);

  let { data, error } = await query.limit(1).maybeSingle();

  if (!data && post.organisation_id && !error) {
    const fallback = await supabase
      .from("social_accounts")
      .select(`id,user_id,organisation_id,platform,access_token,expires_at,page_id,page_name,page_access_token,instagram_business_account_id`)
      .eq("user_id", post.user_id)
      .eq("platform", "meta")
      .is("organisation_id", null)
      .limit(1)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(`Meta connection lookup failed: ${error.message}`);
  if (!data) throw new PermanentPublishError("Meta is not connected. Reconnect Meta in Settings.");

  const connection = data as MetaConnection;
  if (!connection.access_token) throw new PermanentPublishError("Meta connection is missing its access token. Reconnect Meta in Settings.");
  if (tokenExpired(connection.expires_at)) throw new PermanentPublishError("Meta connection has expired. Reconnect Meta in Settings.");
  return connection;
}

async function publishFacebookSinglePhoto({ connection, message, mediaUrl }: { connection: MetaConnection; message: string; mediaUrl: string }) {
  const endpoint = `https://graph.facebook.com/${getMetaGraphVersion()}/${connection.page_id}/photos`;
  const body = new URLSearchParams();
  body.set("url", mediaUrl);
  body.set("caption", message);
  body.set("published", "true");
  body.set("access_token", connection.page_access_token!);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = await safeJsonResponse(response);
  if (!response.ok) throw new Error(`Facebook image publish failed: ${getMetaErrorMessage(result)}`);
  return { destination: "facebook", type: "image", id: result?.post_id ?? result?.id ?? null, response: result };
}

async function publishFacebookMultiPhoto({ connection, message, mediaUrls }: { connection: MetaConnection; message: string; mediaUrls: string[] }) {
  if (mediaUrls.length < 2) throw new PermanentPublishError("Facebook multi-photo publishing requires at least two images.");
  if (mediaUrls.some(isVideoMediaUrl)) throw new PermanentPublishError("Facebook multi-media posts currently support multiple images only in TOTS-OS.");

  const graphVersion = getMetaGraphVersion();
  const accessToken = connection.page_access_token!;
  const uploadedPhotoIds: string[] = [];

  for (let index = 0; index < mediaUrls.length; index += 1) {
    const body = new URLSearchParams();
    body.set("url", mediaUrls[index]);
    body.set("published", "false");
    body.set("access_token", accessToken);

    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${connection.page_id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const result = await safeJsonResponse(response);
    if (!response.ok || !result?.id) throw new Error(`Facebook could not upload image ${index + 1}: ${getMetaErrorMessage(result)}`);
    uploadedPhotoIds.push(String(result.id));
  }

  const feedBody = new URLSearchParams();
  if (message) feedBody.set("message", message);
  feedBody.set("attached_media", JSON.stringify(uploadedPhotoIds.map((id) => ({ media_fbid: id }))));
  feedBody.set("access_token", accessToken);

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${connection.page_id}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: feedBody,
    cache: "no-store",
  });
  const result = await safeJsonResponse(response);
  if (!response.ok || !result?.id) throw new Error(`Facebook multi-image publish failed: ${getMetaErrorMessage(result)}`);
  return { destination: "facebook", type: "carousel", id: result.id, response: { ...result, photo_ids: uploadedPhotoIds } };
}

async function publishFacebookPost({ connection, message, mediaUrls }: { connection: MetaConnection; message: string; mediaUrls: string[] }) {
  if (!connection.page_id) throw new PermanentPublishError("Facebook Page ID is missing. Reconnect Meta in Settings.");
  if (!connection.page_access_token) throw new PermanentPublishError("Facebook Page access token is missing. Reconnect Meta in Settings.");
  if (mediaUrls.length > 1) return publishFacebookMultiPhoto({ connection, message, mediaUrls });

  const mediaUrl = mediaUrls[0] || "";
  const graphVersion = getMetaGraphVersion();
  const accessToken = connection.page_access_token;

  if (mediaUrl && isVideoMediaUrl(mediaUrl)) {
    const body = new URLSearchParams();
    body.set("file_url", mediaUrl);
    body.set("description", message);
    body.set("access_token", accessToken);
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${connection.page_id}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const result = await safeJsonResponse(response);
    if (!response.ok) throw new Error(`Facebook video publish failed: ${getMetaErrorMessage(result)}`);
    return { destination: "facebook", type: "video", id: result?.id ?? null, response: result };
  }

  if (mediaUrl) return publishFacebookSinglePhoto({ connection, message, mediaUrl });

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${connection.page_id}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
    cache: "no-store",
  });
  const result = await safeJsonResponse(response);
  if (!response.ok) throw new Error(`Facebook publish failed: ${getMetaErrorMessage(result)}`);
  return { destination: "facebook", type: "text", id: result?.id ?? null, response: result };
}

async function waitForInstagramContainer({ creationId, accessToken, graphVersion }: { creationId: string; accessToken: string; graphVersion: string }) {
  for (let check = 1; check <= 20; check += 1) {
    const statusUrl = new URL(`https://graph.facebook.com/${graphVersion}/${creationId}`);
    statusUrl.searchParams.set("fields", "status_code,status");
    statusUrl.searchParams.set("access_token", accessToken);

    const response = await fetch(statusUrl.toString(), { method: "GET", cache: "no-store" });
    const result = await safeJsonResponse(response);
    if (!response.ok) throw new Error(`Instagram media status check failed: ${getMetaErrorMessage(result)}`);

    const statusCode = cleanString(result?.status_code).toUpperCase();
    if (statusCode === "FINISHED") return;
    if (statusCode === "ERROR" || statusCode === "EXPIRED") throw new Error(`Instagram media processing failed: ${result?.status || statusCode}`);
    if (check < 20) await sleep(1500);
  }

  throw new Error("Instagram is still processing the media. TOTS-OS will retry the post automatically.");
}

async function createInstagramCarouselChild({ instagramId, accessToken, graphVersion, mediaUrl, index }: { instagramId: string; accessToken: string; graphVersion: string; mediaUrl: string; index: number }) {
  const video = isVideoMediaUrl(mediaUrl);
  const payload: Record<string, unknown> = { is_carousel_item: true, access_token: accessToken };
  if (video) {
    payload.media_type = "VIDEO";
    payload.video_url = mediaUrl;
  } else {
    payload.image_url = mediaUrl;
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${instagramId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await safeJsonResponse(response);
  if (!response.ok || !data?.id) throw new Error(`Instagram could not prepare carousel item ${index + 1}: ${getMetaErrorMessage(data)}`);

  const creationId = String(data.id);
  await waitForInstagramContainer({ creationId, accessToken, graphVersion });
  return { creationId, mediaUrl, type: video ? "video" : "image" };
}

async function publishInstagramCarousel({ connection, message, mediaUrls }: { connection: MetaConnection; message: string; mediaUrls: string[] }) {
  if (!connection.instagram_business_account_id) throw new PermanentPublishError("No Instagram Business or Creator account is linked to this Meta connection.");
  if (!connection.page_access_token) throw new PermanentPublishError("Instagram publishing token is missing. Reconnect Meta in Settings.");
  if (mediaUrls.length < 2) throw new PermanentPublishError("Instagram carousel publishing requires at least two media items.");
  if (mediaUrls.length > 10) throw new PermanentPublishError("Instagram carousel publishing currently supports up to 10 media items in TOTS-OS.");

  const graphVersion = getMetaGraphVersion();
  const instagramId = connection.instagram_business_account_id;
  const accessToken = connection.page_access_token;
  const children = [] as Array<{ creationId: string; mediaUrl: string; type: string }>;

  for (let index = 0; index < mediaUrls.length; index += 1) {
    children.push(await createInstagramCarouselChild({ instagramId, accessToken, graphVersion, mediaUrl: mediaUrls[index], index }));
  }

  const childIds = children.map((child) => child.creationId);
  const parentResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${instagramId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "CAROUSEL", children: childIds.join(","), caption: message, access_token: accessToken }),
    cache: "no-store",
  });
  const parentData = await safeJsonResponse(parentResponse);
  if (!parentResponse.ok || !parentData?.id) throw new Error(`Instagram carousel creation failed: ${getMetaErrorMessage(parentData)}`);

  const creationId = String(parentData.id);
  await waitForInstagramContainer({ creationId, accessToken, graphVersion });

  const publishResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${instagramId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
    cache: "no-store",
  });
  const publishData = await safeJsonResponse(publishResponse);
  if (!publishResponse.ok || !publishData?.id) throw new Error(`Instagram carousel publish failed: ${getMetaErrorMessage(publishData)}`);

  return { destination: "instagram", type: "carousel", creationId, childCreationIds: childIds, children, id: publishData.id, response: publishData };
}

async function publishInstagramSinglePost({ connection, message, mediaUrl }: { connection: MetaConnection; message: string; mediaUrl: string }) {
  if (!connection.instagram_business_account_id) throw new PermanentPublishError("No Instagram Business or Creator account is linked to this Meta connection.");
  if (!connection.page_access_token) throw new PermanentPublishError("Instagram publishing token is missing. Reconnect Meta in Settings.");
  if (!mediaUrl) throw new PermanentPublishError("Instagram requires an image or video.");

  const graphVersion = getMetaGraphVersion();
  const instagramId = connection.instagram_business_account_id;
  const accessToken = connection.page_access_token;
  const video = isVideoMediaUrl(mediaUrl);
  const containerPayload: Record<string, unknown> = { caption: message, access_token: accessToken };

  if (video) {
    containerPayload.media_type = "REELS";
    containerPayload.video_url = mediaUrl;
  } else {
    containerPayload.image_url = mediaUrl;
  }

  const containerResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${instagramId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerPayload),
    cache: "no-store",
  });
  const containerData = await safeJsonResponse(containerResponse);
  if (!containerResponse.ok || !containerData?.id) throw new Error(`Instagram media creation failed: ${getMetaErrorMessage(containerData)}`);

  const creationId = String(containerData.id);
  await waitForInstagramContainer({ creationId, accessToken, graphVersion });

  const publishResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${instagramId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
    cache: "no-store",
  });
  const publishData = await safeJsonResponse(publishResponse);
  if (!publishResponse.ok || !publishData?.id) throw new Error(`Instagram publish failed: ${getMetaErrorMessage(publishData)}`);

  return { destination: "instagram", type: video ? "reel" : "image", creationId, id: publishData.id, response: publishData };
}

async function publishInstagramPost({ connection, message, mediaUrls }: { connection: MetaConnection; message: string; mediaUrls: string[] }) {
  if (mediaUrls.length === 0) throw new PermanentPublishError("Instagram requires an image or video.");
  return mediaUrls.length > 1
    ? publishInstagramCarousel({ connection, message, mediaUrls })
    : publishInstagramSinglePost({ connection, message, mediaUrl: mediaUrls[0] });
}

// ============================================================
// TIKTOK HELPERS
// ============================================================

function isPermanentTikTokCode(code: string) {
  return new Set([
    "access_token_invalid",
    "scope_not_authorized",
    "invalid_param",
    "privacy_level_option_mismatch",
    "url_ownership_unverified",
    "unaudited_client_can_only_post_to_private_accounts",
    "spam_risk_user_banned_from_posting",
  ]).has(code);
}

function throwTikTokApiError(prefix: string, responseData: any, httpStatus?: number): never {
  const code = cleanString(responseData?.error?.code) || `http_${httpStatus || "error"}`;
  const apiMessage = cleanString(responseData?.error?.message) || cleanString(responseData?.message) || cleanString(responseData?.raw);
  const message = `${prefix}: ${apiMessage || JSON.stringify(responseData) || code}`;
  throw new TikTokApiError(message, code, responseData, isPermanentTikTokCode(code));
}

async function getTikTokConnection({ supabase, post }: { supabase: any; post: any }) {
  if (!post.user_id) throw new PermanentPublishError("TikTok post has no user_id.");

  let query = supabase
    .from("social_accounts")
    .select(`id,user_id,organisation_id,access_token,refresh_token,expires_at,platform_user_id`)
    .eq("user_id", post.user_id)
    .eq("platform", "tiktok");

  if (post.organisation_id) query = query.eq("organisation_id", post.organisation_id);

  let { data: connection, error: connectionError } = await query.limit(1).maybeSingle();

  if (!connection && post.organisation_id && !connectionError) {
    const fallback = await supabase
      .from("social_accounts")
      .select(`id,user_id,organisation_id,access_token,refresh_token,expires_at,platform_user_id`)
      .eq("user_id", post.user_id)
      .eq("platform", "tiktok")
      .is("organisation_id", null)
      .limit(1)
      .maybeSingle();
    connection = fallback.data;
    connectionError = fallback.error;
  }

  if (connectionError) throw new Error(`TikTok connection lookup failed: ${connectionError.message}`);
  if (!connection?.access_token) throw new PermanentPublishError("TikTok account is not connected. Connect TikTok in Settings.");

  let resolved = connection as TikTokConnection;
  if (tokenExpired(resolved.expires_at)) resolved = await refreshTikTokConnection({ supabase, connection: resolved });
  return resolved;
}

async function refreshTikTokConnection({ supabase, connection }: { supabase: any; connection: TikTokConnection }) {
  const clientKey = cleanString(process.env.TIKTOK_CLIENT_KEY);
  const clientSecret = cleanString(process.env.TIKTOK_CLIENT_SECRET);
  const refreshToken = cleanString(connection.refresh_token);

  if (!clientKey || !clientSecret) throw new PermanentPublishError("TikTok OAuth credentials are not configured.");
  if (!refreshToken) throw new PermanentPublishError("TikTok access has expired. Reconnect TikTok in Settings.");

  const form = new URLSearchParams();
  form.set("client_key", clientKey);
  form.set("client_secret", clientSecret);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", refreshToken);

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const data = await safeJsonResponse(response);

  if (!response.ok || !data?.access_token) {
    throw new PermanentPublishError(`TikTok token refresh failed. Reconnect TikTok in Settings. ${cleanString(data?.error_description) || cleanString(data?.error) || ""}`.trim());
  }

  const accessToken = cleanString(data.access_token);
  const rotatedRefreshToken = cleanString(data.refresh_token) || refreshToken;
  const expiresIn = Number(data.expires_in ?? 0);
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : connection.expires_at;

  const { error } = await supabase
    .from("social_accounts")
    .update({ access_token: accessToken, refresh_token: rotatedRefreshToken, expires_at: expiresAt })
    .eq("id", connection.id);
  if (error) throw new Error(`TikTok token refreshed but could not be saved: ${error.message}`);

  return { ...connection, access_token: accessToken, refresh_token: rotatedRefreshToken, expires_at: expiresAt } as TikTokConnection;
}

async function queryTikTokCreatorInfo(accessToken: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    cache: "no-store",
  });
  const data = await safeJsonResponse(response);
  if (!response.ok || data?.error?.code !== "ok") throwTikTokApiError("TikTok creator info failed", data, response.status);
  return data;
}

function validateTikTokSettings({ settings, creatorData, hasVideo }: { settings: TikTokPostSettings; creatorData: any; hasVideo: boolean }) {
  const privacyLevel = cleanString(settings.privacy_level);
  const privacyOptions = Array.isArray(creatorData?.data?.privacy_level_options)
    ? creatorData.data.privacy_level_options.map(cleanString).filter(Boolean)
    : [];

  if (!privacyLevel) throw new PermanentPublishError("TikTok privacy has not been selected. Edit this post and choose who can view it.", "missing_privacy_level");
  if (!privacyOptions.includes(privacyLevel)) throw new PermanentPublishError("Your TikTok privacy options have changed. Edit the post and choose a currently available privacy setting.", "privacy_level_changed");
  if (!settings.consent_given) throw new PermanentPublishError("TikTok publishing consent was not confirmed for this post. Edit the post and confirm the TikTok declaration.", "missing_tiktok_consent");

  const commercialContent = Boolean(settings.commercial_content);
  const brandOrganic = commercialContent && Boolean(settings.brand_organic_toggle);
  const brandContent = commercialContent && Boolean(settings.brand_content_toggle);

  if (commercialContent && !brandOrganic && !brandContent) {
    throw new PermanentPublishError("TikTok commercial content is enabled but neither Your brand nor Branded content was selected.", "missing_commercial_disclosure");
  }
  if (brandContent && privacyLevel === "SELF_ONLY") {
    throw new PermanentPublishError("TikTok branded content cannot use Only me visibility. Edit the post and choose an allowed visibility.", "branded_content_private");
  }

  const creatorCommentDisabled = Boolean(creatorData?.data?.comment_disabled);
  const creatorDuetDisabled = Boolean(creatorData?.data?.duet_disabled);
  const creatorStitchDisabled = Boolean(creatorData?.data?.stitch_disabled);

  return {
    privacyLevel,
    brandOrganic,
    brandContent,
    isAigc: Boolean(settings.is_aigc),
    disableComment: creatorCommentDisabled || !Boolean(settings.allow_comment),
    disableDuet: hasVideo ? creatorDuetDisabled || !Boolean(settings.allow_duet) : true,
    disableStitch: hasVideo ? creatorStitchDisabled || !Boolean(settings.allow_stitch) : true,
  };
}

async function publishTikTokPost({ supabase, post, fullMessage }: { supabase: any; post: any; fullMessage: string }) {
  const mediaUrls = getPostMediaUrls(post);
  if (mediaUrls.length === 0) throw new PermanentPublishError("TikTok requires at least one image or video.");

  const videoUrls = mediaUrls.filter(isVideoMediaUrl);
  const imageUrls = mediaUrls.filter((url) => !isVideoMediaUrl(url));
  if (videoUrls.length > 0 && imageUrls.length > 0) throw new PermanentPublishError("TikTok posts cannot mix images and videos.");
  if (videoUrls.length > 1) throw new PermanentPublishError("TikTok supports one video per post in TOTS-OS.");
  if (imageUrls.length > TIKTOK_MAX_PHOTOS) throw new PermanentPublishError(`TikTok supports up to ${TIKTOK_MAX_PHOTOS} photos in one post.`);

  const connection = await getTikTokConnection({ supabase, post });
  const accessToken = cleanString(connection.access_token);
  const creatorData = await queryTikTokCreatorInfo(accessToken);
  const settings = parseTikTokSettings(post.tiktok_settings);
  const validated = validateTikTokSettings({ settings, creatorData, hasVideo: videoUrls.length === 1 });

  if (videoUrls.length === 1) {
    return publishTikTokVideo({ accessToken, creatorData, settings: validated, mediaUrl: videoUrls[0], fullMessage });
  }

  return publishTikTokPhotos({ accessToken, creatorData, settings: validated, mediaUrls: imageUrls, fullMessage });
}

async function publishTikTokPhotos({
  accessToken,
  creatorData,
  settings,
  mediaUrls,
  fullMessage,
}: {
  accessToken: string;
  creatorData: any;
  settings: ReturnType<typeof validateTikTokSettings>;
  mediaUrls: string[];
  fullMessage: string;
}) {
  if (mediaUrls.length === 0) throw new PermanentPublishError("TikTok photo publishing requires at least one image.");

  for (const mediaUrl of mediaUrls) {
    let url: URL;
    try { url = new URL(mediaUrl); } catch { throw new PermanentPublishError(`TikTok image URL is invalid: ${mediaUrl}`); }
    if (url.protocol !== "https:") throw new PermanentPublishError("TikTok photo URLs must use HTTPS.");
    if (isVideoMediaUrl(mediaUrl)) throw new PermanentPublishError("TikTok photo posts can only contain images.");
  }

  const message = fullMessage.trim();
  const title = message.replace(/\s+/g, " ").substring(0, 90);
  const description = message.substring(0, 4000);

  const postInfo: Record<string, unknown> = {
    title,
    description,
    privacy_level: settings.privacyLevel,
    disable_comment: settings.disableComment,
    auto_add_music: true,
    brand_content_toggle: settings.brandContent,
    brand_organic_toggle: settings.brandOrganic,
  };

  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: postInfo,
      source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: mediaUrls },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    }),
    cache: "no-store",
  });
  const initData = await safeJsonResponse(initResponse);
  if (!initResponse.ok || initData?.error?.code !== "ok") throwTikTokApiError("TikTok photo publish init failed", initData, initResponse.status);

  const publishId = cleanString(initData?.data?.publish_id);
  if (!publishId) throw new Error(`TikTok did not return a publish_id for the photo post: ${JSON.stringify(initData)}`);

  return {
    status: "processing",
    platformPostId: publishId,
    response: {
      ...initData,
      media_type: "PHOTO",
      photo_count: mediaUrls.length,
      photo_images: mediaUrls,
      creator: {
        username: creatorData?.data?.creator_username ?? null,
        nickname: creatorData?.data?.creator_nickname ?? null,
        privacy_level: settings.privacyLevel,
        allowed_privacy_levels: creatorData?.data?.privacy_level_options ?? [],
      },
      applied_settings: {
        disable_comment: settings.disableComment,
        brand_content_toggle: settings.brandContent,
        brand_organic_toggle: settings.brandOrganic,
      },
    },
    error: null,
  };
}

async function publishTikTokVideo({
  accessToken,
  creatorData,
  settings,
  mediaUrl,
  fullMessage,
}: {
  accessToken: string;
  creatorData: any;
  settings: ReturnType<typeof validateTikTokSettings>;
  mediaUrl: string;
  fullMessage: string;
}) {
  const videoResponse = await fetch(mediaUrl, { cache: "no-store" });
  if (!videoResponse.ok) throw new Error(`Could not download video from storage: HTTP ${videoResponse.status}`);

  const videoBytes = new Uint8Array(await videoResponse.arrayBuffer());
  const videoSize = videoBytes.byteLength;
  if (!videoSize) throw new PermanentPublishError("Downloaded TikTok video is empty.");
  if (videoSize > TIKTOK_MAX_VIDEO_SIZE) throw new PermanentPublishError("TikTok video exceeds the 4 GB upload limit.");

  const contentType = getTikTokVideoMimeType({ mediaUrl, responseContentType: videoResponse.headers.get("content-type") });
  const { chunkSize, totalChunkCount } = calculateTikTokChunks(videoSize);

  const postInfo: Record<string, unknown> = {
    title: fullMessage.substring(0, 2200),
    privacy_level: settings.privacyLevel,
    disable_comment: settings.disableComment,
    disable_duet: settings.disableDuet,
    disable_stitch: settings.disableStitch,
    video_cover_timestamp_ms: 0,
    brand_content_toggle: settings.brandContent,
    brand_organic_toggle: settings.brandOrganic,
    is_aigc: settings.isAigc,
  };

  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: postInfo,
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    }),
    cache: "no-store",
  });
  const initData = await safeJsonResponse(initResponse);
  if (!initResponse.ok || initData?.error?.code !== "ok") throwTikTokApiError("TikTok publish init failed", initData, initResponse.status);

  const publishId = cleanString(initData?.data?.publish_id);
  const uploadUrl = cleanString(initData?.data?.upload_url);
  if (!publishId) throw new Error(`TikTok did not return a publish_id: ${JSON.stringify(initData)}`);
  if (!uploadUrl) throw new Error(`TikTok did not return an upload_url: ${JSON.stringify(initData)}`);

  await uploadVideoToTikTok({ uploadUrl, videoBytes, videoSize, chunkSize, totalChunkCount, contentType });

  return {
    status: "processing",
    platformPostId: publishId,
    response: {
      ...initData,
      media_type: "VIDEO",
      upload: { transfer_method: "FILE_UPLOAD", video_size: videoSize, chunk_size: chunkSize, total_chunk_count: totalChunkCount, content_type: contentType },
      creator: {
        username: creatorData?.data?.creator_username ?? null,
        nickname: creatorData?.data?.creator_nickname ?? null,
        privacy_level: settings.privacyLevel,
        allowed_privacy_levels: creatorData?.data?.privacy_level_options ?? [],
        max_video_post_duration_sec: creatorData?.data?.max_video_post_duration_sec ?? null,
      },
      applied_settings: {
        disable_comment: settings.disableComment,
        disable_duet: settings.disableDuet,
        disable_stitch: settings.disableStitch,
        brand_content_toggle: settings.brandContent,
        brand_organic_toggle: settings.brandOrganic,
        is_aigc: settings.isAigc,
      },
    },
    error: null,
  };
}

function calculateTikTokChunks(videoSize: number) {
  if (!Number.isFinite(videoSize) || videoSize <= 0) throw new PermanentPublishError(`Invalid TikTok video size: ${videoSize}`);
  if (videoSize <= TIKTOK_MAX_CHUNK_SIZE) return { chunkSize: videoSize, totalChunkCount: 1 };

  const chunkSize = TIKTOK_MAX_CHUNK_SIZE;
  const totalChunkCount = Math.floor(videoSize / chunkSize);
  if (totalChunkCount < 1 || totalChunkCount > TIKTOK_MAX_CHUNKS) throw new PermanentPublishError(`TikTok video requires an unsupported number of chunks: ${totalChunkCount}`);

  const finalChunkSize = videoSize - chunkSize * (totalChunkCount - 1);
  if (finalChunkSize < TIKTOK_MIN_CHUNK_SIZE || finalChunkSize > TIKTOK_MAX_FINAL_CHUNK_SIZE) {
    throw new PermanentPublishError(`TikTok final upload chunk ${finalChunkSize} bytes is outside the allowed range.`);
  }

  return { chunkSize, totalChunkCount };
}

async function uploadVideoToTikTok({
  uploadUrl,
  videoBytes,
  videoSize,
  chunkSize,
  totalChunkCount,
  contentType,
}: {
  uploadUrl: string;
  videoBytes: Uint8Array;
  videoSize: number;
  chunkSize: number;
  totalChunkCount: number;
  contentType: string;
}) {
  for (let chunkIndex = 0; chunkIndex < totalChunkCount; chunkIndex += 1) {
    const startByte = chunkIndex * chunkSize;
    const isLastChunk = chunkIndex === totalChunkCount - 1;
    const endExclusive = isLastChunk ? videoSize : Math.min(startByte + chunkSize, videoSize);
    const lastByte = endExclusive - 1;
    const chunk = videoBytes.slice(startByte, endExclusive);
    const chunkLength = chunk.byteLength;
    if (chunkLength <= 0) throw new Error(`TikTok upload chunk ${chunkIndex + 1} is empty`);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunkLength),
        "Content-Range": `bytes ${startByte}-${lastByte}/${videoSize}`,
      },
      body: new Blob([chunk], { type: contentType }),
    });
    const uploadText = await uploadResponse.text();
    if (!uploadResponse.ok) {
      throw new Error(`TikTok video upload failed on chunk ${chunkIndex + 1}/${totalChunkCount}: HTTP ${uploadResponse.status} ${uploadText || ""}`);
    }
  }
}

async function checkTikTokPostStatus({ supabase, post }: { supabase: any; post: any }) {
  if (!post.user_id) throw new PermanentPublishError("TikTok post has no user_id.");
  if (!post.platform_post_id) throw new PermanentPublishError("TikTok processing post has no publish_id.");

  const connection = await getTikTokConnection({ supabase, post });
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: post.platform_post_id }),
    cache: "no-store",
  });
  const data = await safeJsonResponse(response);
  if (!response.ok || data?.error?.code !== "ok") throwTikTokApiError("TikTok status check failed", data, response.status);

  const status = cleanString(data?.data?.status).toUpperCase();
  if (status === "PUBLISH_COMPLETE") {
    const postIds = data?.data?.publicaly_available_post_id ?? data?.data?.publicly_available_post_id;
    const actualPostId = Array.isArray(postIds) && postIds.length > 0 ? String(postIds[0]) : post.platform_post_id;
    return { status: "published", response: data, platformPostId: actualPostId, error: null };
  }

  if (status === "FAILED") {
    return {
      status: "failed",
      response: data,
      platformPostId: post.platform_post_id,
      error: data?.data?.fail_reason || "TikTok publishing failed",
    };
  }

  return { status: "processing", response: data, platformPostId: post.platform_post_id, error: null };
}

function getTikTokVideoMimeType({ mediaUrl, responseContentType }: { mediaUrl: string; responseContentType: string | null }) {
  const headerMime = responseContentType?.split(";")[0]?.trim()?.toLowerCase();
  if (["video/mp4", "video/quicktime", "video/webm"].includes(headerMime || "")) return headerMime!;

  const cleanUrl = getCleanMediaUrl(mediaUrl);
  if (cleanUrl.endsWith(".mov")) return "video/quicktime";
  if (cleanUrl.endsWith(".webm")) return "video/webm";
  if (cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".m4v")) return "video/mp4";
  throw new PermanentPublishError(`Unsupported TikTok video type. TikTok supports MP4, MOV and WebM. Received: ${responseContentType || mediaUrl}`);
}

function isPermanentError(error: unknown) {
  if (error instanceof PermanentPublishError) return true;
  if (error instanceof TikTokApiError) return error.permanent;
  return false;
}

// ============================================================
// MAIN WORKER
// ============================================================

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return NextResponse.json({ success: false, error: "CRON_SECRET is not configured." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ success: false, processed: 0, published: 0, failed: 0, processing: 0, skipped: 0, error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const counters: PublishCounters = { processed: 0, published: 0, failed: 0, processing: 0, skipped: 0 };
  const now = new Date().toISOString();

  const { data: scheduledQueue, error: scheduledQueueError } = await supabase
    .from("socials")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .or(`attempts.lt.${MAX_ATTEMPTS},attempts.is.null`)
    .order("scheduled_for", { ascending: true })
    .limit(20);

  if (scheduledQueueError) return NextResponse.json({ success: false, ...counters, error: scheduledQueueError.message }, { status: 500 });

  const { data: processingQueue, error: processingQueueError } = await supabase
    .from("socials")
    .select("*")
    .eq("status", "processing")
    .eq("platform", "tiktok")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(20);

  if (processingQueueError) return NextResponse.json({ success: false, ...counters, error: processingQueueError.message }, { status: 500 });

  const queue = [...(scheduledQueue || []), ...(processingQueue || [])];
  if (queue.length === 0) return NextResponse.json({ success: true, ...counters }, { headers: { "Cache-Control": "no-store" } });

  for (const post of queue) {
    const platform = cleanString(post.platform).toLowerCase();
    let attempt = Number(post.attempts ?? 0);

    try {
      // ------------------------------------------------------
      // TIKTOK STATUS POLL
      // ------------------------------------------------------
      if (platform === "tiktok" && post.status === "processing" && post.platform_post_id) {
        const result = await checkTikTokPostStatus({ supabase, post });
        await supabase.from("socials").update({
          status: result.status,
          posted_at: result.status === "published" ? new Date().toISOString() : null,
          platform_post_id: result.platformPostId ?? post.platform_post_id,
          platform_response: result.response ?? null,
          last_error: result.error ?? null,
          error: result.error ?? null,
          last_attempt_at: new Date().toISOString(),
        }).eq("id", post.id);

        counters.processed += 1;
        if (result.status === "published") {
          counters.published += 1;
          if (post.user_id) await createNotification({
            supabase,
            userId: post.user_id,
            organisationId: post.organisation_id ?? null,
            title: "TikTok published",
            message: "Your TikTok post was published successfully.",
            type: "success",
            metadata: { platform: "tiktok", social_post_id: post.id, platform_post_id: result.platformPostId },
          });
        } else if (result.status === "failed") {
          counters.failed += 1;
          if (post.user_id) await createNotification({
            supabase,
            userId: post.user_id,
            organisationId: post.organisation_id ?? null,
            title: "TikTok post failed",
            message: result.error || "TikTok could not publish your post.",
            type: "error",
            metadata: { platform: "tiktok", social_post_id: post.id },
          });
        } else {
          counters.processing += 1;
        }
        continue;
      }

      // ------------------------------------------------------
      // NEW ATTEMPT
      // ------------------------------------------------------
      attempt += 1;
      const { error: attemptUpdateError } = await supabase.from("socials").update({
        attempts: attempt,
        last_attempt_at: new Date().toISOString(),
        last_error: null,
        error: null,
      }).eq("id", post.id);
      if (attemptUpdateError) throw new Error(`Could not update publishing attempt: ${attemptUpdateError.message}`);

      const fullMessage = [cleanString(post.caption), cleanString(post.hashtags)].filter(Boolean).join("\n\n");
      const mediaUrls = getPostMediaUrls(post);
      const mediaUrl = mediaUrls[0] || "";

      console.log("[CRON SOCIAL] Publishing:", { postId: post.id, platform, attempt, mediaCount: mediaUrls.length });

      // ------------------------------------------------------
      // TIKTOK
      // ------------------------------------------------------
      if (platform === "tiktok") {
        const result = await publishTikTokPost({ supabase, post, fullMessage });
        await supabase.from("socials").update({
          status: result.status,
          platform_post_id: result.platformPostId ?? null,
          platform_response: result.response ?? null,
          last_error: result.error ?? null,
          error: result.error ?? null,
          posted_at: result.status === "published" ? new Date().toISOString() : null,
          last_attempt_at: new Date().toISOString(),
        }).eq("id", post.id);

        counters.processed += 1;
        if (result.status === "published") {
          counters.published += 1;
          if (post.user_id) await createNotification({
            supabase,
            userId: post.user_id,
            organisationId: post.organisation_id ?? null,
            title: "TikTok published",
            message: "Your TikTok post was published successfully.",
            type: "success",
            metadata: { platform: "tiktok", social_post_id: post.id, platform_post_id: result.platformPostId },
          });
        } else {
          counters.processing += 1;
        }
        continue;
      }

      // ------------------------------------------------------
      // META / FACEBOOK / INSTAGRAM
      // ------------------------------------------------------
      if (["meta", "facebook", "instagram"].includes(platform)) {
        const connection = await getMetaConnection({ supabase, post });
        const publishFacebook = platform === "facebook" || platform === "meta";
        const publishInstagram = platform === "instagram" || (platform === "meta" && mediaUrls.length > 0 && Boolean(connection.instagram_business_account_id));
        const results: Record<string, any> = {};
        const errors: Array<{ destination: string; error: string }> = [];

        if (publishFacebook) {
          try { results.facebook = await publishFacebookPost({ connection, message: fullMessage, mediaUrls }); }
          catch (error) { errors.push({ destination: "facebook", error: error instanceof Error ? error.message : "Facebook publishing failed." }); }
        }

        if (publishInstagram) {
          try { results.instagram = await publishInstagramPost({ connection, message: fullMessage, mediaUrls }); }
          catch (error) { errors.push({ destination: "instagram", error: error instanceof Error ? error.message : "Instagram publishing failed." }); }
        }

        if (Object.keys(results).length === 0) {
          throw new Error(errors.map((item) => `${getPlatformLabel(item.destination)}: ${item.error}`).join(" | ") || "Social publishing failed.");
        }

        const platformPostId = results.facebook?.id || results.facebook?.response?.post_id || results.facebook?.response?.id || results.instagram?.id || null;
        const warning = errors.length > 0 ? errors.map((item) => `${getPlatformLabel(item.destination)}: ${item.error}`).join(" | ") : null;

        await supabase.from("socials").update({
          status: "published",
          posted_at: new Date().toISOString(),
          platform_post_id: platformPostId,
          platform_response: { results, errors, media_count: mediaUrls.length, media_urls: mediaUrls, facebook: publishFacebook, instagram: publishInstagram },
          last_error: warning,
          error: warning,
          last_attempt_at: new Date().toISOString(),
        }).eq("id", post.id);

        counters.processed += 1;
        counters.published += 1;

        if (results.facebook && post.user_id) await createNotification({
          supabase,
          userId: post.user_id,
          organisationId: post.organisation_id ?? connection.organisation_id ?? null,
          title: "Facebook post published",
          message: "Your post was published successfully to Facebook.",
          type: "success",
          metadata: { platform: "facebook", social_post_id: post.id },
        });

        if (results.instagram && post.user_id) await createNotification({
          supabase,
          userId: post.user_id,
          organisationId: post.organisation_id ?? connection.organisation_id ?? null,
          title: "Instagram post published",
          message: "Your post was published successfully to Instagram.",
          type: "success",
          metadata: { platform: "instagram", social_post_id: post.id },
        });

        if (warning && post.user_id) await createNotification({
          supabase,
          userId: post.user_id,
          organisationId: post.organisation_id ?? null,
          title: "Some social publishing failed",
          message: warning,
          type: "warning",
          metadata: { platform, social_post_id: post.id, partial_success: true },
        });
        continue;
      }

      // ------------------------------------------------------
      // PINTEREST
      // ------------------------------------------------------
      if (platform === "pinterest") {
        const { data: dynamicToken, error: tokenError } = await supabase
          .from("social_tokens")
          .select("access_token, platform_account_id")
          .eq("user_id", post.user_id)
          .eq("platform", "pinterest")
          .maybeSingle();

        if (tokenError) throw new Error(`Pinterest token lookup failed: ${tokenError.message}`);
        if (!dynamicToken?.access_token) throw new PermanentPublishError("Missing Pinterest social token");
        if (!dynamicToken.platform_account_id) throw new PermanentPublishError("Missing Pinterest board ID");
        if (!mediaUrl) throw new PermanentPublishError("Pinterest requires an image.");
        if (isVideoMediaUrl(mediaUrl)) throw new PermanentPublishError("Pinterest image publishing requires an image.");

        const response = await fetch("https://api.pinterest.com/v5/pins", {
          method: "POST",
          headers: { Authorization: `Bearer ${dynamicToken.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            link: "https://tots-os.co.uk",
            title: "Shared via TOTS-OS",
            description: fullMessage,
            board_id: dynamicToken.platform_account_id,
            media_source: { source_type: "image_url", url: mediaUrl },
          }),
          cache: "no-store",
        });
        const result = await safeJsonResponse(response);
        if (!response.ok) throw new Error(`Pinterest publish failed: ${JSON.stringify(result)}`);

        await supabase.from("socials").update({
          status: "published",
          posted_at: new Date().toISOString(),
          platform_post_id: result?.id ?? null,
          platform_response: result ?? null,
          last_error: null,
          error: null,
        }).eq("id", post.id);
        counters.processed += 1;
        counters.published += 1;
        continue;
      }

      // ------------------------------------------------------
      // LINKEDIN
      // ------------------------------------------------------
      if (platform === "linkedin") throw new PermanentPublishError("LinkedIn publishing is not available yet.");

      counters.skipped += 1;
      throw new PermanentPublishError(`Unsupported platform: ${platform || "unknown"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[CRON SOCIAL] Publish error for post ${post.id}:`, error);

      const processingPost = post.status === "processing";
      const effectiveAttempt = processingPost ? Number(post.attempts ?? 0) : attempt;
      const permanent = isPermanentError(error);
      const finalFailure = permanent || (!processingPost && effectiveAttempt >= MAX_ATTEMPTS);
      const nextStatus = finalFailure ? "failed" : processingPost ? "processing" : "scheduled";

      const platformResponse = error instanceof TikTokApiError ? error.responseData : post.platform_response ?? null;

      await supabase.from("socials").update({
        status: nextStatus,
        last_error: message,
        error: message,
        last_attempt_at: new Date().toISOString(),
        ...(platformResponse ? { platform_response: platformResponse } : {}),
      }).eq("id", post.id);

      counters.processed += 1;
      if (finalFailure) {
        counters.failed += 1;
        if (post.user_id) await createNotification({
          supabase,
          userId: post.user_id,
          organisationId: post.organisation_id ?? null,
          title: `${getPlatformLabel(platform)} post failed`,
          message,
          type: "error",
          metadata: {
            platform,
            social_post_id: post.id,
            attempts: effectiveAttempt,
            permanent,
            error_code: error instanceof TikTokApiError ? error.code : error instanceof PermanentPublishError ? error.code ?? null : null,
          },
        });
      } else if (processingPost) {
        counters.processing += 1;
      }
    }
  }

  return NextResponse.json({ success: true, ...counters }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
