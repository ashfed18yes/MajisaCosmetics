import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * Creates a server-side Supabase client for use in Server Components,
 * Server Actions, and Route Handlers with secure cookie persistence.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing Supabase public credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.'
    );
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored when middleware or Route Handlers refresh user sessions.
        }
      },
    },
  });
}

/**
 * Authenticates the current customer with Supabase Auth, memoized per request.
 *
 * PERFORMANCE OPTIMIZATION:
 * Wrapped in React cache():
 * When multiple Server Components or Actions in the same request call getCachedUser(),
 * the remote Supabase auth call runs only once, completely eliminating duplicate 1.2-1.5s round trips.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user: user ?? null, error };
});
