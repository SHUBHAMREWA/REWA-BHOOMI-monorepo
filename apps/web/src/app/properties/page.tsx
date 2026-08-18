import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertiesSearchPage from '@/features/properties/PropertiesSearchPage';
import { APP_NAME } from '@rewa-bhoomi/config';

export const metadata: Metadata = {
  title: `Properties for Sale and Rent — ${APP_NAME}`,
  description: 'Search and filter properties across Rewa and Madhya Pradesh.',
};

export default function PropertiesRoute() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', padding: '100px' }}>Loading...</div>}>
      <PropertiesSearchPage />
    </Suspense>
  );
}
