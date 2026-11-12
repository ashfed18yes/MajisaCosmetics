import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Updates the user session and refreshes auth tokens on incoming requests.
 * Uses `@supabase/ssr` to read and set cookies on both request and response.
 *
 * CRITICAL SECURITY & STABILITY RULES:
 * - Uses only public client credentials (never SUPABASE_SECRET_KEY).
 * - Always calls `supabase.auth.getUser()` to validate and refresh the JWT.
 * - Protects authenticated customer routes (e.g. `/account`).
 * - Preserves public routes and static assets.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Fallback handler: If an auth code arrives at root or any non-callback path,
  // forward it to /auth/callback so the PKCE code exchange executes properly.
  const authCode = request.nextUrl.searchParams.get('code');
  if (authCode && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

  // FAST PATH 1: Inspect incoming cookies for Supabase authentication tokens.
  // Supabase SSR tokens are keyed with 'sb-<project-ref>-auth-token' or similar prefixes.
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) =>
      c.name.startsWith('sb-') &&
      (c.name.includes('-auth-token') || c.name.includes('access-token') || c.name.includes('refresh-token'))
  );

  const isAccountRoute = pathname.startsWith('/account');
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/sign-in' || pathname === '/sign-up';

  // FAST PATH 2: If there are NO auth cookies whatsoever:
  // - Unauthenticated visitor visiting /account or /admin -> instant redirect to sign-in (0ms DB delay)
  // - Public storefront pages (/, /collections, /brands, /products, etc.) -> pass through immediately (0ms DB delay)
  // - Auth pages (/sign-in, /sign-up) -> pass through immediately without redundant validation
  if (!hasAuthCookie) {
    if (isAccountRoute || isAdminRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/sign-in';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // FAST PATH 3: If it's a Next.js prefetch request, do not execute a remote auth network call.
  // Prefetches only need the static or cached RSC payload; they do not mutate or refresh auth cookies.
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch';

  if (isPrefetch && !isAccountRoute && !isAdminRoute && !isAuthRoute) {
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
    // Forward any session cookie changes to redirect response
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

