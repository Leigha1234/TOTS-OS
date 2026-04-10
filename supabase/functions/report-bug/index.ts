import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { errorDetails, location, userEmail } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sentinel <system@theorganisedtypes.com>', // Or your verified domain
        to: 'theorganisedtypes@gmail.com',
        subject: `🚨 CRITICAL_BUG: ${location}`,
        html: `
          <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px;">
            <p style="color: #a9b897; font-weight: bold; letter-spacing: 0.2em; font-size: 10px;">SENTINEL PROTOCOL ACTIVATED</p>
            <h1 style="font-style: italic; font-family: serif;">System Deviation Detected</h1>
            <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
            <p><strong>URL:</strong> <span style="color: #888;">${location}</span></p>
            <p><strong>USER:</strong> <span style="color: #888;">${userEmail}</span></p>
            <div style="background: #111; padding: 20px; border-radius: 10px; font-family: monospace; color: #ff5555; border-left: 4px solid #ff5555;">
              ${errorDetails}
            </div>
            <p style="font-size: 12px; color: #555; margin-top: 30px;">This incident has been logged. Initialise fix immediately to maintain Elite Tier standards.</p>
          </div>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})