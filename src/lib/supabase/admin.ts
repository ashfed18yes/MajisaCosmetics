import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a server-only administrative Supabase client using the Secret Key.
 *
 * CRITICAL SECURITY RULES:
 * - This file contains `import 'server-only'` to prevent it from ever being bundled into client code.
 * - NEVER import or call this function inside client components or browser-facing bundles.
 * - NEVER expose SUPABASE_SECRET_KEY as a NEXT_PUBLIC_ variable.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'Missing Supabase administrative credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.'
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

