import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      return new Response("Missing RESEND_API_KEY", { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TOTS-OS <welcome@tots-os.co.uk>",
        to: email,
        subject: "Welcome to TOTS-OS 👋",
        html: `
          <h1>Welcome 👋</h1>
          <p>You’ve successfully joined the newsletter.</p>
        `,
      }),
    });

    const data = await res.text();

    return new Response(data, {
      status: res.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});