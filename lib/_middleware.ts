import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // 1. Initialize modern server client with secure cookie forwarding
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
    // CRITICAL EXEMPTION: Allow all accounts to hit the billing management paths unconditionally
    if (pathname === '/settings/manage-subscription') {
      return response;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();

    // Standardize casing strings from database schema lookup gracefully
    const tier = (profile?.subscription_tier || 'STANDARD').toUpperCase();

    // Protect administrative core /settings paths (Only allow ELITE users past, except billing)
    if (pathname.startsWith('/settings') && tier !== 'ELITE') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect "PREMIUM" or "ELITE" features (e.g., Projects pipeline)
    if (pathname.startsWith('/projects') && tier === 'STANDARD') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

// 4. Configure match rules to filter overhead execution on static asset arrays
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/projects/:path*',
    '/login'
  ],
};