// lib/supabase.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This function creates a new client instance
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}