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
    const { team_id, project_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch real task data
    const { data: tasks } = await supabase
      .from('tasks')
      .select('name, status')
      .eq('team_id', team_id)
      .limit(10);

    const taskList = tasks?.length 
      ? tasks.map(t => `${t.name} (${t.status})`).join(', ') 
      : "No current tasks";

    // 2. Call Gemini for a real strategic insight
    const aiKey = Deno.env.get('AI_KEY');
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${aiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Context: ${taskList}. Task: Provide a 1-sentence professional strategic advice for this team.` }] }]
        })
      }
    );

    const aiData = await aiResponse.json();
    const insight = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Focus on high-priority milestones to maintain momentum.";

    // 3. THE SAFETY NET: Try to log, but don't crash if it fails
    try {
      await supabase.from('clarity_scans').insert({
        team_id,
        project_id: project_id || null,
        insight_text: insight,
        scan_type: 'dashboard_overview'
      });
    } catch (logError) {
      console.error("History logging skipped:", logError);
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})