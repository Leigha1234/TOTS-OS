import { createBrowserClient, createServerClient } from "@supabase/ssr";

// Browser Client: Singleton pattern
let browserClient: any = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

// Server Client: Use this in Server Components/Actions
export async function createClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          cookieStore.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}