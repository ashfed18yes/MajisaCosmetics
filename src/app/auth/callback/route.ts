import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Validates the redirect target path to strictly prevent open-redirect vulnerabilities.
 * Ensures the target is an internal relative path starting with '/' and not '//' or containing hostnames.
 */
function getSafeRedirectUrl(nextParam: string | null, defaultPath = '/account'): string {
  if (!nextParam) {
    return defaultPath;
  }

  // Reject paths that do not start with '/' or start with '//' (protocol-relative) or contain backslashes
  if (!nextParam.startsWith('/') || nextParam.startsWith('//') || nextParam.includes('\\')) {
    return defaultPath;
  }

  try {
    const parsed = new URL(nextParam, 'http://localhost');
    // Ensure the host was not altered
    if (parsed.origin !== 'http://localhost') {
      return defaultPath;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return defaultPath;
  }
}

/**
 * Route handler to exchange Supabase authentication codes for sessions.
 * Used for email verification, magic links, OAuth, and password recovery redirects.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirectTo');
  const targetPath = getSafeRedirectUrl(next, '/account');

  // Compute origin, taking reverse proxy or load balancer headers into account (e.g. Vercel)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';

  const baseOrigin = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${baseOrigin}${targetPath}`);
      }

      console.error('Supabase auth callback exchange error:', error.message);
      return NextResponse.redirect(
        `${baseOrigin}/sign-in?error=${encodeURIComponent(
          'Authentication failed or verification link expired. Please sign in again.'
        )}`
      );
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(
        `${baseOrigin}/sign-in?error=${encodeURIComponent(
          'An unexpected error occurred during authentication.'
        )}`
      );
    }
  }

  // Handle case where Supabase sent error params in URL (e.g. link expired)
  const errorDescription =
    requestUrl.searchParams.get('error_description') ||
    requestUrl.searchParams.get('error') ||
    'No authentication code provided.';

  return NextResponse.redirect(
    `${baseOrigin}/sign-in?error=${encodeURIComponent(errorDescription)}`
  );
}

