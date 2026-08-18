import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProfilePage from '@/features/profile/ProfilePage';

export const metadata: Metadata = {
  title: 'My Profile — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function ProfileRoute() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}
