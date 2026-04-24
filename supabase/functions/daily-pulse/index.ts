import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Initialize the Supabase client with the service role key 
  // (necessary for admin privileges to read across rows)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 1. Find all overdue tasks
  const { data: overdueTasks, error } = await supabase
    .from('tasks')
    .select('title, user_id')
    .lt('due_date', new Date().toISOString())
    .eq('status', 'todo');

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // TODO: Implement Jira Issue creation logic here if needed
  // Example: Use fetch() to POST to Jira API using credentials from Deno.env

  // 2. Logic for "Daily Summary" notification
  // Example: Map over overdueTasks and send notifications via Resend/Postmark
  
  return new Response(
    JSON.stringify({ 
      message: "Pulse Complete", 
      count: overdueTasks?.length || 0 
    }), 
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }
  );
});