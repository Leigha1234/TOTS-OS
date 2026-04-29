import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // 1. Basic Auth Guards
  if (pathname.startsWith('/dashboard') && !session) return NextResponse.redirect(new URL('/login', request.url));
  if (pathname === '/login' && session) return NextResponse.redirect(new URL('/dashboard', request.url));

  // 2. Tier Guard Logic
  if (session) {
    // Fetch tier once
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', session.user.id)
      .single();

    const tier = profile?.tier || 'STANDARD';

    // Protect "ELITE" pages
    if (pathname.startsWith('/settings') && tier !== 'ELITE') {
      return NextResponse.redirect(new URL('/profile', request.url));
    }

    // Protect "PREMIUM" or "ELITE" pages (like Projects)
    if (pathname.startsWith('/projects') && tier === 'STANDARD') {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }

  return response;
}