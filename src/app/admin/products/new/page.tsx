import React from 'react';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import ProductFormClient from '../ProductFormClient';

export const metadata = {
  title: 'Add New Product | Majisa Admin',
  description: 'Add a new luxury cosmetic product to your catalog.',
};

export default async function NewProductPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Fetch available brands and categories
  const [{ data: brands }, { data: categories }] = await Promise.all([
    adminClient.from('brands').select('id, name').order('name', { ascending: true }),
    adminClient.from('categories').select('id, name').order('name', { ascending: true }),
  ]);

  return (
    <ProductFormClient
      mode="create"
      initialBrands={brands || []}
      initialCategories={categories || []}
    />
  );
}

