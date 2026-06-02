// lib/getUserTeam.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export async function getUserTeam() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { data: null, error: 'Not initialized' };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  return { user, authError };
}

function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  // Prefer a service role key on the server, fall back to anon key if necessary
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE key in environment');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
