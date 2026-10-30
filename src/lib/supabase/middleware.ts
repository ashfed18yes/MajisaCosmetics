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
  const isAccountRoute = request.nextUrl.pathname.startsWith('/account');

  if (!user && isAccountRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/sign-in';
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Forward any session cookie changes (such as cleared expired tokens) to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // If already authenticated and visiting sign-in or sign-up, redirect to /account
  const isAuthRoute =
    request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up';
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/account';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

