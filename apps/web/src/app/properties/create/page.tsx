import type { Metadata } from 'next';
import { Suspense } from 'react';
import CreatePropertyPage from '@/features/properties/CreatePropertyPage';

export const metadata: Metadata = {
  title: 'Post a Property — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function CreatePropertyRoute() {
  return (
    <Suspense>
      <CreatePropertyPage />
    </Suspense>
  );
}
