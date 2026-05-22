import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // 1. Initialize modern server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }));
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // 2. Core Auth Guards
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Subscription & Tier Guard Logic Matrix
  if (session) {
    // ADMIN BYPASS: Always allow your primary developer email access to everything
    if (session.user.email === 'YOUR_EMAIL@EXAMPLE.COM') {
      return response;
    }

    // CRITICAL EXEMPTION: Allow all accounts to hit the billing management paths unconditionally
    if (pathname === '/settings/manage-subscription') {
      return response;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();

    const tier = (profile?.subscription_tier || 'STANDARD').toUpperCase();

    // UPDATED: Allow STANDARD users to access main /settings, 
    // but keep specific restriction if you intended to lock parts of it.
    // If you want everyone to access settings, remove this block:
    if (pathname.startsWith('/settings') && tier === 'LOCKED_TIER') { 
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect "PREMIUM" or "ELITE" features (e.g., Projects pipeline)
    if (pathname.startsWith('/projects') && tier === 'STANDARD') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/projects/:path*',
    '/login'
  ],
};