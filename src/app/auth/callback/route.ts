import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
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
 * Route handler to exchange Supabase authentication codes or verify OTP tokens.
 * Supports Google OAuth, Email Confirmation, Magic Links, and Password Recovery.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirectTo');

  // Compute origin, taking reverse proxy or load balancer headers into account (e.g. Vercel)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const host = forwardedHost ? forwardedHost.split(',')[0].trim() : null;

  // Local development check (preserves localhost in development and dev server)
  const isLocalhost =
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1';

  const baseOrigin = isLocalhost
    ? requestUrl.origin
    : host
    ? `${forwardedProto}://${host}`
    : requestUrl.origin;

  // Determine default target path based on operation type
  const isRecovery = type === 'recovery' || requestUrl.searchParams.get('type') === 'recovery' || next?.includes('/reset-password');
  const defaultTarget = isRecovery ? '/reset-password' : '/account';
  const targetPath = getSafeRedirectUrl(next, defaultTarget);

  // 1. Handle PKCE Code exchange (Used by Google OAuth and standard Supabase auth)
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${baseOrigin}${targetPath}`);
      }

      console.error('Supabase auth callback exchange error:', error.message);
      const redirectTarget = isRecovery ? '/forgot-password' : '/sign-in';
      return NextResponse.redirect(
        `${baseOrigin}${redirectTarget}?error=${encodeURIComponent(
          'Authentication failed or verification link expired. Please try again.'
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

  // 2. Handle token_hash verification (Used by email confirmation, password recovery, magic link)
  if (token_hash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(`${baseOrigin}${targetPath}`);
      }

      console.error('Supabase auth verifyOtp error:', error.message);
      const redirectTarget = isRecovery ? '/forgot-password' : '/sign-in';
      return NextResponse.redirect(
        `${baseOrigin}${redirectTarget}?error=${encodeURIComponent(
          error.message || 'Verification link is invalid or has expired.'
        )}`
      );
    } catch (err) {
      console.error('Unexpected error in verifyOtp callback:', err);
      return NextResponse.redirect(
        `${baseOrigin}/sign-in?error=${encodeURIComponent(
          'An unexpected error occurred during verification.'
        )}`
      );
    }
  }

  // Handle case where Supabase sent error params in URL (e.g. link expired)
  const errorDescription =
    requestUrl.searchParams.get('error_description') ||
    requestUrl.searchParams.get('error') ||
    'No authentication code or verification token provided.';

  return NextResponse.redirect(
    `${baseOrigin}/sign-in?error=${encodeURIComponent(errorDescription)}`
  );
}
