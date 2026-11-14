import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Parses JWT expiration timestamp from incoming Supabase auth cookie payload.
 * Runs in O(1) time without external network calls.
 */
function getAuthTokenExp(cookies: Array<{ name: string; value: string }>): number | null {
  for (const c of cookies) {
    if (
      c.name.startsWith('sb-') &&
      (c.name.includes('-auth-token') || c.name.includes('access-token'))
    ) {
      let val = c.value;
      if (val.startsWith('base64-')) {
        try {
          val = Buffer.from(val.slice(7), 'base64url').toString('utf8');
        } catch {}
      }
      try {
        const parsed = JSON.parse(val);
        const token =
          parsed.access_token ||
          (Array.isArray(parsed) && typeof parsed[0] === 'string' ? parsed[0] : null);
        if (token && typeof token === 'string') {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            return typeof payload.exp === 'number' ? payload.exp : null;
          }
        }
      } catch {
        const parts = val.split('.');
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            return typeof payload.exp === 'number' ? payload.exp : null;
          } catch {}
        }
      }
    }
  }
  return null;
}

/**
 * Updates the user session and refreshes auth tokens on incoming requests.
 * Uses `@supabase/ssr` to read and set cookies on both request and response.
 *
 * CRITICAL PERFORMANCE & SECURITY RULES:
 * - Uses only public client credentials (never SUPABASE_SECRET_KEY).
 * - Fast-paths Next.js prefetch requests (0ms delay).
 * - Fast-paths unexpired customer sessions without blocking on remote auth calls.
 * - Protects authenticated customer routes (e.g. `/account`) and admin routes.
 * - Preserves public routes and static assets.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Fallback handler: If an auth code or token_hash arrives at root or any non-callback path,
  // forward it to /auth/callback so the PKCE code exchange or OTP verification executes properly.
  const authCode = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  if ((authCode || tokenHash) && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

  // FAST PATH 1: Next.js router prefetch requests
  // Prefetches are speculative background requests sent on link hover/in-viewport.
  // They only require static or RSC payloads and must NEVER execute remote auth round-trips.
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch';

  if (isPrefetch) {
    return supabaseResponse;
  }

  // FAST PATH 2: Inspect incoming cookies for Supabase authentication tokens.
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) =>
      c.name.startsWith('sb-') &&
      (c.name.includes('-auth-token') || c.name.includes('access-token') || c.name.includes('refresh-token'))
  );

  const isAccountRoute = pathname.startsWith('/account');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/sign-in' || pathname === '/sign-up';

  // FAST PATH 3: If there are NO auth cookies whatsoever:
  // - Unauthenticated visitor visiting /account or /admin -> instant redirect to sign-in (0ms delay)
  // - Public storefront pages -> pass through immediately (0ms delay)
  // - Auth pages (/sign-in, /sign-up) -> pass through immediately
  if (!hasAuthCookie) {
    if (isAccountRoute || isAdminRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/sign-in';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // FAST PATH 4: Inspect local token expiration
  // If the JWT access token is valid and unexpired with > 60 seconds of validity remaining,
  // do not block middleware on a remote Supabase auth network round-trip.
  // Protected server components (/account, /admin) authoritatively verify user identity.
  const now = Math.floor(Date.now() / 1000);
  const tokenExp = getAuthTokenExp(allCookies);

  if (tokenExp && tokenExp > now + 60) {
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/account';
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Calling getUser() validates the token with Supabase and triggers setAll if refreshed
  let user = null;
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (!error && authUser) {
      user = authUser;
    }
  } catch {
    // If Supabase is temporarily unreachable, fail gracefully to unauthenticated state
    user = null;
  }

  // Route protection for private customer routes (e.g. /account)
  if (!user && isAccountRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/sign-in';
    redirectUrl.searchParams.set('redirectTo', pathname);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // If already authenticated and visiting sign-in or sign-up, redirect to /account
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/account';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
