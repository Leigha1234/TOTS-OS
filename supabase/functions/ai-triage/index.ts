Deno.serve(async (req) => {
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: any = {};

    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const authHeader = req.headers.get("Authorization");

    console.log("AI Triage received:", {
      body,
      hasAuth: !!authHeader,
    });

    // TODO: your AI logic here

    return new Response(
      JSON.stringify({
        success: true,
        message: "ai-triage processed",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI Triage error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "access-control-allow-origin": "*",
        },
      }
    );
  }
});