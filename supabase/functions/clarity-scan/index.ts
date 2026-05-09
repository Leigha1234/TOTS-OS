// Setup type definitions for Supabase Edge Runtime
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project_id, team_id } = await req.json()

    if (!team_id) throw new Error("Validation Failed: No team_id provided in request.")

    // 1. Initialize Supabase Client with Service Role to bypass RLS for logging scans
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Tasks (Scoped by team)
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('name, status, priority, due_date')
      .eq('team_id', team_id)

    if (tasksError) throw new Error(`Database Error (Tasks): ${tasksError.message}`)

    // 3. Prepare AI Prompt with fallback for empty task lists
    const taskSummary = tasks && tasks.length > 0 
      ? tasks.map(t => `- ${t.name} (${t.status}, Due: ${t.due_date || 'N/A'})`).join('\n')
      : "The team has no active tasks currently listed."

    const prompt = `You are the TOTS-OS Intelligence Engine. Analyze this data and provide a 2-sentence high-level strategic insight for the team. Be concise and slightly futuristic: \n${taskSummary}`

    // 4. Call AI (Gemini)
    const apiKey = Deno.env.get('AI_KEY')
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const aiData = await aiResponse.json()
    
    if (aiData.error) throw new Error(`AI Provider Error: ${aiData.error.message}`)
    if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('AI Provider returned an empty insight.')
    }

    const insight = aiData.candidates[0].content.parts[0].text

    // 5. Log the scan result (Wrapped in a try-catch so scan results still show if logging fails)
    try {
      await supabaseClient.from('clarity_scans').insert({
        team_id: team_id,
        project_id: project_id || null,
        insight_text: insight,
        scan_type: project_id ? 'project_detail' : 'dashboard_overview'
      })
    } catch (dbErr) {
      console.warn("Database Logging Failed:", dbErr)
    }

    return new Response(
      JSON.stringify({ insight }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error("Function Execution Failed:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    )
  }
})