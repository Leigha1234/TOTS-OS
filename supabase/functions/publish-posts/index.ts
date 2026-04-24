import { createClient } from "jsr:@supabase/supabase-js@2";

// Standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get posts that are 'scheduled' where the time has passed
    const now = new Date().toISOString();
    
    const { data: posts, error: fetchError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (fetchError) throw fetchError;

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ message: "No pending posts found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const results = [];

    // 2. Loop and push to Ayrshare
    for (const post of posts) {
      const ayrshareKey = Deno.env.get('AYRSHARE_API_KEY');
      
      const res = await fetch("https://app.ayrshare.com/api/post", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${ayrshareKey}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          post: post.content || post.caption,
          platforms: [post.platform.toLowerCase()]
        })
      });

      const resData = await res.json();

      if (res.ok) {
        // Update status to 'posted'
        await supabase
          .from('social_posts')
          .update({ 
            status: 'posted',
            posted_at: new Date().toISOString(),
            external_id: resData.id || null
          })
          .eq('id', post.id);
        
        results.push({ id: post.id, status: 'success' });
      } else {
        console.error(`Ayrshare error for post ${post.id}:`, resData);
        results.push({ id: post.id, status: 'failed', error: resData });
      }
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});