import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a server-side Supabase client for reading public catalog data (products, categories, brands)
 * WITHOUT reading Next.js request cookies.
 *
 * This allows Next.js App Router to perform Incremental Static Regeneration (ISR) and static page
 * generation without bailing out due to dynamic cookie usage.
 */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing Supabase public credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

