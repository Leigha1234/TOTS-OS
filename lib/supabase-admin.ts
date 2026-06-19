import { createClient } from "@supabase/supabase-js";

/**
 * SUPABASE ADMIN CLIENT (SERVER ONLY)
 * Never import into client components or browser bundles
 */

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return { supabaseUrl, supabaseServiceKey };
}

export const supabaseAdmin = (() => {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin must only be used on the server");
  }

  if (supabaseAdminInstance) return supabaseAdminInstance;

  const { supabaseUrl, supabaseServiceKey } = getEnv();

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