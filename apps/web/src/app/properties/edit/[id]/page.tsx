import type { Metadata } from 'next';
import { Suspense } from 'react';
import CreatePropertyPage from '@/features/properties/CreatePropertyPage';

export const metadata: Metadata = {
  title: 'Edit Property — Rewa Bhoomi',
  robots: { index: false, follow: false },
};

export default function EditPropertyRoute({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <CreatePropertyPage propertyId={params.id} />
    </Suspense>
  );
}
