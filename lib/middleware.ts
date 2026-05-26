/**
 * TOTS OS v7.1.0 - MIDDLEWARE GOVERNANCE
 * LAYER: EDGE-COMPUTE AUTH & BILLING GATE
 * * This middleware protects core modules, enforces tiered subscription access,
 * and maintains security header integrity.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// --- GOVERNANCE CONFIGURATION ---
const PROTECTED_PATHS = ['/dashboard', '/settings', '/projects', '/hr', '/finance'];
const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/api/webhooks'];
const BILLING_PATH = '/pricing';
const SUBSCRIPTION_REQUIRED_PATHS = ['/dashboard', '/projects', '/hr', '/finance'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // 1. SECURITY HEADER INJECTION
  response.headers.set('x-tots-os-version', '7.1.0');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 2. AUTHENTICATION GUARD
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. PREVENT LOGGED-IN REDIRECT LOOPS
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. SUBSCRIPTION GATE (The Pay-First Wall)
  if (session && SUBSCRIPTION_REQUIRED_PATHS.some(path => pathname.startsWith(path))) {
    
    // Extract tier from Metadata (Cached in JWT for optimal performance)
    const tier = (session.user.user_metadata?.subscription_tier as string)?.toLowerCase() || 'unpaid';

    // A. Billing Bypass: Users must be allowed to reach the pricing page
    if (pathname === BILLING_PATH || pathname.startsWith('/settings/manage-subscription')) {
      return response;
    }

    // B. Enforcement of Payment
    if (tier === 'unpaid') {
      return NextResponse.redirect(new URL(BILLING_PATH, request.url));
    }

    // C. Tiered Capability Gating (e.g., Enterprise features)
    // Example: Only 'elite' users allowed access to /projects
    if (pathname.startsWith('/projects') && tier !== 'elite') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

/**
 * MATCHING CONFIGURATION
 * We exclude static assets to prevent performance degradation.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/**
 * SYSTEM NOTES:
 * - This middleware performs authentication and subscription checks at the edge.
 * - By utilizing user_metadata within the JWT, we avoid database roundtrips.
 * - Tiered gating ensures revenue protection for premium TOTS OS modules.
 * - Always keep static assets excluded in the matcher to maintain latency below 50ms.
 */