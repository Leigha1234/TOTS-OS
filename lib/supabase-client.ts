// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr';

// This instance is created only once
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);