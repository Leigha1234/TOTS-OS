import { createClient } from "@supabase/supabase-js";

/**
 * SUPABASE ADMIN CLIENT (SERVER ONLY)
 * - Service role key must NEVER be exposed to the browser
 * - This client is hardened to prevent accidental client-side usage
 */

if (typeof window !== "undefined") {
  throw new Error(
    "supabaseAdmin should NEVER be imported in the browser. It is server-only."
  );
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = (() => {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-client-info": "tots-os-admin",
      },
    },
  });

  return supabaseAdminInstance;
})();