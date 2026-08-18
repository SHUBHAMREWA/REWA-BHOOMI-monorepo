import type { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';

export const metadata: Metadata = {
  title: 'Reset Password — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function ResetPasswordRoute() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
