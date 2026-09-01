import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertiesSearchPage from '@/features/properties/PropertiesSearchPage';
import { PropertiesSearchPageSkeleton } from '@/features/properties/PropertySkeletons';
import { APP_NAME, APP_URL } from '@rewa-bhoomi/config';

export const metadata: Metadata = {
  title: `Properties for Sale and Rent — ${APP_NAME}`,
  description: 'Search and filter properties across Rewa and Madhya Pradesh.',
  openGraph: {
    title: `Properties for Sale and Rent — ${APP_NAME}`,
    description: 'Search and filter properties across Rewa and Madhya Pradesh.',
    url: `${APP_URL}/properties`,
    siteName: APP_NAME,
    images: [{ url: `${APP_URL}/og-image.jpg`, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Properties for Sale and Rent — ${APP_NAME}`,
    description: 'Search and filter properties across Rewa and Madhya Pradesh.',
    images: [`${APP_URL}/og-image.jpg`],
  },
};

export default function PropertiesRoute() {
  return (
    <Suspense fallback={<PropertiesSearchPageSkeleton />}>
      <PropertiesSearchPage />
    </Suspense>
  );
}
