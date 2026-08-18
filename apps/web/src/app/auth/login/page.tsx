import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginPage from '@/features/auth/LoginPage';

export const metadata: Metadata = {
  title: 'Sign In — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function LoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
