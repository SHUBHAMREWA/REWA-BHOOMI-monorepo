import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterPage from '@/features/auth/RegisterPage';

export const metadata: Metadata = {
  title: 'Create Account — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function RegisterRoute() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
