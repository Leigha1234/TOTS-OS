import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    const { team_id } = body;

    // 1. Log the incoming request so we can see it in Supabase Logs
    console.log("Processing request for team_id:", team_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const aiKey = Deno.env.get('AI_KEY');

    if (!aiKey) throw new Error("AI_KEY is not set in Supabase Secrets");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Simple Fetch
    const { data: tasks } = await supabase
      .from('tasks')
      .select('name')
      .eq('team_id', team_id)
      .limit(5);

    // 3. Simple AI Call
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${aiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Give a 1-sentence productivity tip for a team working on: ${tasks?.map(t => t.name).join(', ') || 'General tasks'}` }] }]
        })
      }
    );

    const aiData = await aiResponse.json();
    const insight = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Stay focused on your current milestones.";

    // 4. WE ARE SKIPPING THE DATABASE INSERT FOR NOW TO RULE OUT DB ERRORS
    
    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // This is what you are seeing in the console
    });
  }
})