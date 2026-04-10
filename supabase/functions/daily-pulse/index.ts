import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-client@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Find all overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('title, user_id')
    .lt('due_date', new Date().toISOString())
    .eq('status', 'todo')

  // 2. logic for "Daily Summary" notification
  // This is where you would integrate an Email API like Resend or Postmark
  
  return new Response(JSON.stringify({ message: "Pulse Complete", count: overdueTasks?.length }), {
    headers: { "Content-Type": "application/json" },
  })
})