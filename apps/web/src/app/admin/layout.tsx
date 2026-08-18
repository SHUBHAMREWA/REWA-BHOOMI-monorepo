import type { Metadata } from 'next';
import AdminLayout from '@/features/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
