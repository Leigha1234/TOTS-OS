// Setup type definitions for Supabase Edge Runtime
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests (Important for browser security)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project_id, team_id } = await req.json()

    if (!team_id) {
      throw new Error("Missing team_id in request body")
    }

    // 1. Initialize Supabase Client with Service Role (to bypass RLS for logging)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Tasks for the scan
    let query = supabaseClient
      .from('tasks')
      .select('name, status, priority, due_date')
      .eq('team_id', team_id)

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    const { data: tasks, error: tasksError } = await query
    if (tasksError) throw tasksError

    // 3. Prepare the AI Prompt
    const taskSummary = tasks && tasks.length > 0 
      ? tasks.map(t => `- ${t.name} (${t.status}, Due: ${t.due_date || 'N/A'})`).join('\n')
      : "No active tasks found for this team currently."

    const prompt = `You are the TOTS-OS Intelligence Engine. Analyze the following project state and provide a 2-sentence high-level strategic insight. Be concise, professional, and slightly futuristic in tone: \n${taskSummary}`

    // 4. Call the AI (Gemini Pro)
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
    
    // Check if Gemini returned an error (like an invalid API key)
    if (aiData.error) {
      throw new Error(`AI Provider Error: ${aiData.error.message}`)
    }

    if (!aiData.candidates || aiData.candidates.length === 0) {
      throw new Error('AI Provider failed to generate insight.')
    }

    const insight = aiData.candidates[0].content.parts[0].text

    // 5. Log the scan result for history
    // We use a try/catch here so that even if the log fails, the user still gets their insight
    try {
      await supabaseClient.from('clarity_scans').insert({
        team_id: team_id,
        project_id: project_id || null,
        insight_text: insight,
        scan_type: project_id ? 'project_detail' : 'dashboard_overview'
      })
    } catch (dbLogErr) {
      console.error("Failed to log scan to database:", dbLogErr)
    }

    // 6. Final response
    return new Response(
      JSON.stringify({ insight }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Edge Function Error:", errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    )
  }
})