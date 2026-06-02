import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function storeOAuthToken(params: {
  userId: string;
  platform: "meta" | "linkedin" | "tiktok";
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  platformUserId?: string;
}) {
  const { userId, platform, accessToken, refreshToken, expiresIn, platformUserId } = params;

  const expires_at = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  const { error } = await supabase.from("social_accounts").upsert({
    user_id: userId,
    platform,
    access_token: accessToken,
    refresh_token: refreshToken ?? null,
    expires_at,
    platform_user_id: platformUserId ?? null,
  });

  if (error) {
    console.error("Token storage error:", error);
    throw new Error("Failed to store OAuth token");
  }
}