import 'server-only';
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
 * If not authenticated: redirects to sign-in with a return redirect.
 * If authenticated but not an admin: redirects to customer account.
 */
export async function requireAdmin(): Promise<{ user: AdminUser }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/sign-in?redirectTo=/admin/products');
  }

  // Check public.user_roles table for 'admin' role
  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !roleRow) {
    // Authenticated customer has no administrative role
    redirect('/account?error=unauthorized_admin');
  }

  // Fetch full name for the admin header
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  return {
    user: {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || 'Admin',
    },
  };
}

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

