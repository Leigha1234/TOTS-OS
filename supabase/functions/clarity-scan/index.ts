// Setup type definitions for Supabase Edge Runtime
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// CORS headers to allow your React app to call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests (Important for browser security)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project_id, team_id } = await req.json()

    // 1. Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch Tasks for the scan
    // Query is scoped to the team_id. project_id is optional for a general scan.
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
    // Summarize the task list for the AI to read
    const taskSummary = tasks && tasks.length > 0 
      ? tasks.map(t => `- ${t.name} (${t.status}, Due: ${t.due_date})`).join('\n')
      : "No active tasks found."

    const prompt = `You are the TOTS-OS Intelligence Engine. Analyze these project tasks and provide a 2-sentence high-level strategic insight for the team. Be concise and professional: \n${taskSummary}`

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
    
    if (!aiData.candidates || aiData.candidates.length === 0) {
      console.error('AI API Response Error:', aiData)
      throw new Error('AI Provider failed to generate insight.')
    }

    const insight = aiData.candidates[0].content.parts[0].text

    // 5. Log the scan result for history
    await supabaseClient.from('clarity_scans').insert({
      team_id,
      project_id,
      insight_text: insight,
      scan_type: project_id ? 'project_detail' : 'dashboard_overview'
    })

    // 6. Final response back to your React Frontend
    return new Response(
      JSON.stringify({ insight }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (error: unknown) {
    // Type-safe error handling to clear VS Code errors
    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    )
  }
})