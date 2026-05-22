import { createBrowserClient, createServerClient } from "@supabase/ssr";

// 1. Browser Singleton (Use this in all client components)
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

// 2. Server Client (Use this in Middleware or Server Actions)
export async function createServerSideClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => { cookieStore.set(name, value, options); },
        remove: (name: string, options: any) => { cookieStore.set(name, "", { ...options, maxAge: 0 }); },
      },
    }
  );
}