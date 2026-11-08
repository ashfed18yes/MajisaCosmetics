import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Server-side security guard that ensures the current request
 * originates from an authenticated user with 'admin' role in public.user_roles.
 *
 * Wrapped in React cache() to memoize execution per request:
 * When layout.tsx and page.tsx both call requireAdmin(), the second call returns
 * instantly from memory with zero duplicate database round trips!
 *
 * Parallelizes user_roles and profiles queries for optimal performance.
 */
export const requireAdmin = cache(async (): Promise<{ user: AdminUser }> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/sign-in?redirectTo=/admin/products');
  }

  // Parallelize role check and profile lookup
  const [roleRes, profileRes] = await Promise.all([
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  if (roleRes.error || !roleRes.data) {
    // Authenticated customer has no administrative role
    redirect('/account?error=unauthorized_admin');
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
      fullName: profileRes.data?.full_name || 'Admin',
    },
  };
});

/**
 * Check if the currently authenticated user is an admin without throwing/redirecting.
 * Useful for conditionally showing admin links in navigation or account screens.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !!roleRow;
  } catch {
    return false;
  }
}

