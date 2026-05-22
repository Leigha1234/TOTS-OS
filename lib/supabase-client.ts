import { createBrowserClient } from "@supabase/ssr";

let browserClient: any = null;

export function getBrowserClient() {
  if (typeof window === 'undefined') return null;
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}