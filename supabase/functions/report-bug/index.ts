// supabase/functions/report-bug/index.ts

const ALLOWED_ORIGINS = [
  'https://www.tots-os.co.uk',
  'https://tots-os.co.uk'
];

function getCorsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? null;

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }

  let errorDetails = '';
  let userEmail = '';
  let location = '';

  try {
    const body = await req.json();
    errorDetails = body?.errorDetails ?? '';
    userEmail = body?.userEmail ?? '';
    location = body?.location ?? '';
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: getCorsHeaders(origin) }
    );
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY' }),
        {
          status: 500,
          headers: getCorsHeaders(origin)
        }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Sentinel <system@theorganisedtypes.com>',
        to: 'theorganisedtypes@gmail.com',
        subject: `🚨 SYSTEM BUG DETECTED: ${location}`,
        html: `
          <h2>Elite Tier Error Detected</h2>
          <p><strong>User:</strong> ${userEmail}</p>
          <p><strong>Page:</strong> ${location}</p>
          <pre style="background: #f4f4f4; padding: 10px;">${errorDetails}</pre>
          <p><em>Initialise fix immediately.</em></p>
        `,
      }),
    });

    if (!res.ok) {
      let errorData: any = {};
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: 'Non-JSON response from Resend' };
      }

      throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
    }

    return new Response(JSON.stringify({ sent: true }), { 
      status: 200,
      headers: getCorsHeaders(origin)
    });
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }), 
      { 
        status: 500, 
        headers: getCorsHeaders(origin)
      }
    );
  }
});