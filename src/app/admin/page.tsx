import React, { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import AdminDashboardLoading from './loading';
import AdminDashboardData from './AdminDashboardData';

export const metadata = {
  title: 'Operations Dashboard | MajisaAdmin',
  description: 'Enterprise operations, fulfillment KPIs, and real-time payment audit.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardData />
    </Suspense>
  );
}
