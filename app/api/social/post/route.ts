import { NextRequest, NextResponse } from "next/server";
import {
  createServerClient,
} from "@supabase/ssr";

import {
  cookies,
} from "next/headers";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type PublishDestination =
  | "facebook"
  | "instagram";

type PublishRequestBody = {
  socialAccountId?:
    string;
  organisationId?: string;

  content?:
    string;

  imageUrl?:
    string;

  destinations?:
    PublishDestination[];
};

type SocialAccountRow = {
  id:
    string;

  user_id:
    string;

  organisation_id?:
    string | null;

  platform:
    string;

  access_token?:
    string | null;

  page_id?:
    string | null;

  page_name?:
    string | null;

  page_access_token?:
    string | null;

  instagram_business_account_id?:
    string | null;

  display_name?:
    string | null;
};

type MetaErrorResponse = {
  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      number;

    error_subcode?:
      number;

    fbtrace_id?:
      string;
  };

  id?:
    string;

  post_id?:
    string;
};

type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
    priority?: "low" | "medium" | "high";
  };
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================

function getGraphVersion() {
  const configured =
    process.env
      .META_GRAPH_API_VERSION
      ?.trim();

  if (
    configured
  ) {
    return configured.startsWith(
      "v"
    )
      ? configured
      : `v${configured}`;
  }

  return "v25.0";
}

// ============================================================

async function readMetaResponse(
  response:
    Response
) {
  return (
    await response
      .json()
      .catch(
        () =>
          ({})
      )
  ) as MetaErrorResponse;
}

// ============================================================

function getMetaErrorMessage(
  result:
    MetaErrorResponse,

  fallback:
    string
) {
  return (
    result
      ?.error
      ?.message ||
    fallback
  );
}

// ============================================================
// FACEBOOK
// ============================================================

async function publishToFacebook({
  account,
  content,
  imageUrl,
}: {
  account:
    SocialAccountRow;

  content:
    string;

  imageUrl:
    string;
}) {
  if (
    !account.page_id ||
    !account.page_access_token
  ) {
    throw new Error(
      "Facebook Page connection is incomplete. Reconnect Meta and make sure Page permissions are granted."
    );
  }

  const graphVersion =
    getGraphVersion();

  // ==========================================================
  // IMAGE POST
  // ==========================================================

  if (
    imageUrl
  ) {
    const endpoint =
      `https://graph.facebook.com/${graphVersion}/${account.page_id}/photos`;

    const response =
      await fetch(
        endpoint,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              url:
                imageUrl,

              caption:
                content,

              published:
                true,

              access_token:
                account.page_access_token,
            }),

          cache:
            "no-store",
        }
      );

    const result =
      await readMetaResponse(
        response
      );

    if (
      !response.ok
    ) {
      console.error(
        "[SOCIAL POST] Facebook image publishing failed:",
        result
      );

      throw new Error(
        getMetaErrorMessage(
          result,
          "Facebook image post failed."
        )
      );
    }

    return {
      success:
        true,

      destination:
        "facebook" as const,

      type:
        "image",

      id:
        result.post_id ||
        result.id ||
        null,

      raw:
        result,
    };
  }

  // ==========================================================
  // TEXT POST
  // ==========================================================

  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${account.page_id}/feed`;

  const response =
    await fetch(
      endpoint,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message:
              content,

            access_token:
              account.page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const result =
    await readMetaResponse(
      response
    );

  if (
    !response.ok
  ) {
    console.error(
      "[SOCIAL POST] Facebook text publishing failed:",
      result
    );

    throw new Error(
      getMetaErrorMessage(
        result,
        "Facebook post failed."
      )
    );
  }

  return {
    success:
      true,

    destination:
      "facebook" as const,

    type:
      "text",

    id:
      result.id ||
      null,

    raw:
      result,
  };
}

// ============================================================
// INSTAGRAM
// ============================================================

async function publishToInstagram({
  account,
  content,
  imageUrl,
}: {
  account:
    SocialAccountRow;

  content:
    string;

  imageUrl:
    string;
}) {
  if (
    !account
      .instagram_business_account_id
  ) {
    throw new Error(
      "No Instagram Business or Creator account is linked to this Facebook Page."
    );
  }

  if (
    !account.page_access_token
  ) {
    throw new Error(
      "Instagram connection is missing its Meta Page access token. Reconnect Meta."
    );
  }

  if (
    !imageUrl
  ) {
    throw new Error(
      "Instagram requires an image URL for this type of post."
    );
  }

  const graphVersion =
    getGraphVersion();

  // ==========================================================
  // 1. CREATE MEDIA CONTAINER
  // ==========================================================

  const createUrl =
    `https://graph.facebook.com/${graphVersion}/${account.instagram_business_account_id}/media`;

  const createResponse =
    await fetch(
      createUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            image_url:
              imageUrl,

            caption:
              content,

            access_token:
              account.page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const createResult =
    await readMetaResponse(
      createResponse
    );

  if (
    !createResponse.ok ||
    !createResult.id
  ) {
    console.error(
      "[SOCIAL POST] Instagram media creation failed:",
      createResult
    );

    throw new Error(
      getMetaErrorMessage(
        createResult,
        "Instagram media creation failed."
      )
    );
  }

  const creationId =
    createResult.id;

  // ==========================================================
  // 2. PUBLISH MEDIA CONTAINER
  // ==========================================================

  const publishUrl =
    `https://graph.facebook.com/${graphVersion}/${account.instagram_business_account_id}/media_publish`;

  const publishResponse =
    await fetch(
      publishUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            creation_id:
              creationId,

            access_token:
              account.page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const publishResult =
    await readMetaResponse(
      publishResponse
    );

  if (
    !publishResponse.ok ||
    !publishResult.id
  ) {
    console.error(
      "[SOCIAL POST] Instagram publish failed:",
      publishResult
    );

    throw new Error(
      getMetaErrorMessage(
        publishResult,
        "Instagram publishing failed."
      )
    );
  }

  return {
    success:
      true,

    destination:
      "instagram" as const,

    type:
      "image",

    creationId,

    id:
      publishResult.id,

    raw:
      publishResult,
  };
}

// ============================================================
// POST — IMMEDIATE META PUBLISHING
// ============================================================
// Important: this route requires the caller to explicitly provide the
// selected organisation. No client-provided account or org ID is trusted.
export async function POST(req: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };
  const fail = (error: string, status: number) =>
    NextResponse.json({ success: false, error }, { status, headers: noStore });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return fail("Social publishing is not configured.", 500);

    // Preserve the existing cookie-based login, but also support an
    // Authorization bearer token for agency-aware frontend requests.
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: SupabaseCookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch { /* Cookie writes can be unavailable in route contexts. */ }
        },
      },
    });

    const incomingBearer = req.headers.get("authorization");
    const bearerToken = incomingBearer?.match(/^Bearer\s+(.+)$/i)?.[1];
    let token = bearerToken || "";
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || "";
    }
    if (!token) return fail("You must be signed in to publish.", 401);

    let body: PublishRequestBody;
    try { body = (await req.json()) as PublishRequestBody; }
    catch { return fail("Invalid social post request.", 400); }

    const organisationId = cleanString(body.organisationId);
    const socialAccountId = cleanString(body.socialAccountId);
    const content = cleanString(body.content);
    const imageUrl = cleanString(body.imageUrl);
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID.test(organisationId)) {
      return fail("Select an organisation before publishing. Update the Social Studio caller to send organisationId.", 400);
    }
    if (!UUID.test(socialAccountId)) return fail("Select a social account first.", 400);
    if (!content || content.length > 10000) return fail("Add post content (up to 10,000 characters).", 400);

    // Authorise the actual action, not just viewing the organisation.
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return fail("You must be signed in to publish.", 401);

    // Use the authenticated client so Supabase RLS enforces access.
    const { data: rawAccount, error: accountError } = await supabase
      .from("social_accounts")
      .select("id,user_id,organisation_id,platform,access_token,page_id,page_name,page_access_token,instagram_business_account_id,display_name")
      .eq("id", socialAccountId)
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (accountError) return fail("Unable to load the connected account.", 500);
    if (!rawAccount) return fail("Social account not found in the selected organisation.", 404);
    const account = rawAccount as SocialAccountRow;
    const platform = cleanString(account.platform).toLowerCase();

    if (!["meta", "facebook", "instagram"].includes(platform)) {
      if (platform === "tiktok") return fail("Use the TOTS-OS TikTok publishing workflow.", 409);
      if (platform === "linkedin") return fail("LinkedIn publishing is not available through this endpoint.", 501);
      return fail(`Unsupported social platform: ${platform || "unknown"}.`, 400);
    }

    const requested = body.destinations;
    if (requested !== undefined && !Array.isArray(requested)) {
      return fail("Invalid publishing destinations.", 400);
    }
    if (requested?.some((d) => d !== "facebook" && d !== "instagram")) {
      return fail("Only Facebook and Instagram are supported here.", 400);
    }
    let destinations: PublishDestination[] = requested?.length
      ? [...new Set(requested)]
      : ["facebook"];
    if (!requested?.length && imageUrl && account.instagram_business_account_id) {
      destinations.push("instagram");
    }
    if (destinations.includes("instagram") && !imageUrl) {
      return fail("Instagram image publishing requires an image URL.", 400);
    }

    const results: Array<Record<string, unknown>> = [];
    const errors: Array<{ destination: PublishDestination; error: string }> = [];
    for (const destination of destinations) {
      try {
        const result = destination === "facebook"
          ? await publishToFacebook({ account, content, imageUrl })
          : await publishToInstagram({ account, content, imageUrl });
        results.push(result as unknown as Record<string, unknown>);
      } catch (error) {
        errors.push({ destination, error: error instanceof Error ? error.message : "Publishing failed." });
      }
    }

    // Never log access tokens or raw Meta API payloads.
    console.info("[SOCIAL POST] Publishing outcome", {
      organisationId, socialAccountId, destinations,
      successCount: results.length, failureCount: errors.length,
    });
    const success = results.length > 0;
    return NextResponse.json({
      success,
      partialSuccess: success && errors.length > 0,
      message: success
        ? errors.length ? "Published to some destinations; others failed." : "Post published successfully."
        : "Publishing failed.",
      successfulDestinations: results.map((r) => r.destination),
      results, errors,
    }, { status: success ? 200 : 502, headers: noStore });
  } catch (error) {
    console.error("[SOCIAL POST] Unexpected publishing error", error instanceof Error ? error.message : "Unknown error");
    return fail("Unable to publish social post.", 500);
  }
}
