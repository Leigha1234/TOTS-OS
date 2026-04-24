// supabase/functions/report-bug/index.ts

Deno.serve(async (req) => {
  // Handle CORS for browser requests if necessary
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  try {
    const { errorDetails, userEmail, location } = await req.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
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
      const errorData = await res.json();
      throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
    }

    return new Response(JSON.stringify({ sent: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});