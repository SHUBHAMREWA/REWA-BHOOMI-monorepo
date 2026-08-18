import type { Metadata } from 'next';
import { Suspense } from 'react';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';

export const metadata: Metadata = {
  title: 'Forgot Password — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordRoute() {
  return (
    <Suspense>
      <ForgotPasswordPage />
    </Suspense>
  );
}
