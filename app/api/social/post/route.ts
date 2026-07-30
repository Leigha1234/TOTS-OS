

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie writes in route handlers when unavailable
            }
          },
        },
      }
    );
    const body = await req.json();

    const {
      socialAccountId,
      content,
      imageUrl,
    } = body;

    if (!socialAccountId || !content) {
      return NextResponse.json(
        { error: "Missing social account or content" },
        { status: 400 }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", socialAccountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Social account not found" },
        { status: 404 }
      );
    }

    let response;

    if (account.platform === "meta") {
      if (!account.page_id || !account.page_access_token) {
        return NextResponse.json(
          { error: "Facebook page connection is incomplete" },
          { status: 400 }
        );
      }

      response = await fetch(
        `https://graph.facebook.com/v23.0/${account.page_id}/feed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            access_token: account.page_access_token,
          }),
        }
      );
    } else if (account.platform === "instagram") {
      if (!account.instagram_business_account_id || !account.page_access_token) {
        return NextResponse.json(
          { error: "Instagram business account connection is incomplete" },
          { status: 400 }
        );
      }

      if (!imageUrl) {
        return NextResponse.json(
          { error: "Instagram posts require an image URL" },
          { status: 400 }
        );
      }

      const createMedia = await fetch(
        `https://graph.facebook.com/v23.0/${account.instagram_business_account_id}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: content,
            access_token: account.page_access_token,
          }),
        }
      );

      const mediaData = await createMedia.json();

      if (!createMedia.ok) {
        return NextResponse.json(
          { error: "Instagram media creation failed", details: mediaData },
          { status: 500 }
        );
      }

      response = await fetch(
        `https://graph.facebook.com/v23.0/${account.instagram_business_account_id}/media_publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creation_id: mediaData.id,
            access_token: account.page_access_token,
          }),
        }
      );
    } else if (account.platform === "linkedin") {
      return NextResponse.json(
        { error: "LinkedIn publishing integration pending" },
        { status: 501 }
      );
    } else if (account.platform === "tiktok") {
      return NextResponse.json(
        { error: "TikTok publishing integration pending" },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Social post failed", details: result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Social post error:", error);

    return NextResponse.json(
      { error: "Unable to publish social post" },
      { status: 500 }
    );
  }
}