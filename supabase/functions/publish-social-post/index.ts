import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const body = await req.json();
    const { platform, content, media, access_token } = body;

    if (!platform || !content) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers,
      });
    }

    // =========================
    // FACEBOOK / META PAGE POST
    // =========================
    if (platform === "meta" || platform === "facebook") {
      const pageId = media?.pageId;

      const params = new URLSearchParams();
      params.append("message", content);
      params.append("access_token", access_token);

      const res = await fetch(
        `https://graph.facebook.com/v23.0/${pageId}/feed`,
        {
          method: "POST",
          body: params,
        }
      );

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        headers,
      });
    }

    // =========================
    // INSTAGRAM POST (BUSINESS ACCOUNT)
    // =========================
    if (platform === "instagram") {
      const igUserId = media?.igUserId;
      const imageUrl = media?.image_url || media?.media_url;

      if (!igUserId || !imageUrl) {
        return new Response(
          JSON.stringify({ error: "Missing Instagram media data" }),
          { status: 400, headers }
        );
      }

      // Step 1: Create media container
      const createRes = await fetch(
        `https://graph.facebook.com/v23.0/${igUserId}/media`,
        {
          method: "POST",
          body: new URLSearchParams({
            image_url: imageUrl,
            caption: content,
            access_token,
          }),
        }
      );

      const createData = await createRes.json();

      if (!createData.id) {
        return new Response(JSON.stringify(createData), {
          status: 400,
          headers,
        });
      }

      // Step 2: Publish container
      const publishRes = await fetch(
        `https://graph.facebook.com/v23.0/${igUserId}/media_publish`,
        {
          method: "POST",
          body: new URLSearchParams({
            creation_id: createData.id,
            access_token,
          }),
        }
      );

      const publishData = await publishRes.json();

      return new Response(JSON.stringify(publishData), {
        headers,
      });
    }

    // =========================
    // LINKEDIN / TIKTOK PLACEHOLDERS
    // =========================
    return new Response(
      JSON.stringify({ success: true, platform }),
      { headers }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers,
    });
  }
});