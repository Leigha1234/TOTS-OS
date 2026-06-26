import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response("Missing RESEND_API_KEY", { status: 500 });
    }

    const body = await req.json();
    const record = body?.record;

    if (!record?.email) {
      return new Response("Missing email", { status: 400 });
    }

    const email = String(record.email).trim().toLowerCase();
    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "TOTS-OS <onboarding@resend.dev>";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Welcome to TOTS-OS 👋",
        html: `
          <h1>Welcome to TOTS-OS 👋</h1>
          <p>You’ve successfully joined the newsletter.</p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendText = await resendResponse.text();
      return new Response(`Resend error: ${resendText}`, { status: 502 });
    }

    return new Response("ok");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response("Error: " + message, { status: 500 });
  }
});