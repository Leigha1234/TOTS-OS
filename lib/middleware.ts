import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface CookieSetOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieSetOptions;
}

const PROTECTED_PATHS = ['/dashboard', '/settings', '/projects', '/hr', '/finance'];
const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/api/webhooks'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response: NextResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase: ReturnType<typeof createServerClient> = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: (): ReturnType<typeof request.cookies.getAll> => request.cookies.getAll(),
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic: boolean = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isProtected: boolean = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  // -----------------------------
  // Allow public routes without interference
  // -----------------------------
  if (isPublic) {
    return response;
  }

  // -----------------------------
  // If not authenticated, block protected routes
  // -----------------------------
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // -----------------------------
  // If logged in, prevent access to login page
  // -----------------------------
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // -----------------------------
  // Security headers only
  // -----------------------------
  response.headers.set('x-tots-os-version', '7.1.0');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};