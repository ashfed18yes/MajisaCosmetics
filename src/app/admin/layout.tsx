import React from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import AdminShell from './AdminShell';

export const metadata = {
  title: 'Operations Dashboard | Majisa Cosmetics',
  description: 'Enterprise Order Management, Payment Verification, and Product Administration.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return <AdminShell user={user}>{children}</AdminShell>;
}
